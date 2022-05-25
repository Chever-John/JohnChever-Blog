---
slug: 如何在APISIX_Ingress中使用go-plugin-runner
title: 如何在 APISIX Ingress 中使用 go-plugin-runner
authors: CheverJohn
tags: [k8s, apisix, Ingress, docker]
---

# 如何在 APISIX Ingress 中使用 go-plugin-runner

[toc]

## 背景描述

当我在社区闲逛的时候，发现有一位用户对“如何在 APISIX Ingress 的环境下使用多语言插件”这个问题存在困惑。而我正好同时是 go-plugin-runner 的使用者，以及对 APISIX Ingress 项目有一点了解，于是便诞生了这篇文档。

<!--truncate-->
## 方案描述

本文基于 0.3 版本的 go-plugin-runner 插件和 1.4.0 版本的 APISIX Ingress，详细讲述了从构建集群到构建镜像，再到自定义helm chart 包以及最后部署资源的全部过程。可以保证的是，根据这篇文档，可以完整的得出最后的结果。

```bash
go-plugin-runner: 0.3
APISIX Ingress: 	1.4.0

kind: 						kind v0.12.0 go1.17.8 linux/amd64
kubectl version:	Client Version: v1.23.5/Server Version: v1.23.4
golang:						go1.18 linux/amd64
```

## 正文

### 构建集群环境

首先选择 kind 构建本地集群环境。命令如下：

```bash
cat <<EOF | kind create cluster --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
EOF
```

### 打包构建 go-plugin-runner 的可执行文件

如果你插件写完了的话，就可以开始编译可执行文件以搭配 APISIX 运行了。

本文推荐两种打包构建方案：

1. 将打包流程放进 Dockerfile，在之后构建 docker 镜像的时候顺道将编译过程完成。
2. 也可以按照本文档采用的方案，先打包可执行文件，再将打包好的可执行文件复制到镜像中去。

如何选择方案，我认为这取决于你本地硬件的考量。此处选择第二种方案的原因是想要依靠本地强大的硬件提高打包速度，加快流程。

#### 进入到 go-plugin-runner 目录

选择一个的文件夹地址 `/home/chever/api7/cloud_native/tasks/plugin-runner`，并将我们的 `apisix-go-plugin-runner` 项目置于此文件夹下。

放置成功后，文件树如下所示：

```bash
chever@cloud-native-01:~/api7/cloud_native/tasks/plugin-runner$ tree -L 1
.
└── apisix-go-plugin-runner

1 directory, 0 files
```

然后你需要进入到 `apisix-go-plugin-runner/cmd/go-runner/plugins` 目录，并在该目录下编写你所需要的插件。本文章将使用默认插件 `say` 作演示。

```bash
chever@cloud-native-01:~/api7/cloud_native/tasks/plugin-runner/apisix-go-plugin-runner$ tree cmd
cmd
└── go-runner
    ├── main.go
    ├── main_test.go
    ├── plugins
    │   ├── fault_injection.go
    │   ├── fault_injection_test.go
    │   ├── limit_req.go
    │   ├── limit_req_test.go
    │   ├── say.go
    │   └── say_test.go
    └── version.go
    
2 directories, 10 files
```

写完插件后，开始正式编译可执行文件，此处需要注意，你应该编写静态的可执行文件，非动态。

打包编译命令如下：

```bash
CGO_ENABLED=0 go build -a -ldflags '-extldflags "-static"' .
```

这样便成功打包了一个静态编译的 `go-runner` 可执行文件。

在  `apisix-go-plugin-runner/cmd/go-runner/` 目录下，可以看到当前文件树是这样的

```bash
chever@cloud-native-01:~/api7/cloud_native/tasks/plugin-runner/apisix-go-plugin-runner/cmd/go-runner$ tree -L 1
.
├── go-runner
├── main.go
├── main_test.go
├── plugins
└── version.go

1 directory, 4 files
```

请记住 `apisix-go-plugin-runner/cmd/go-runner/go-runner` 这个路径，我们将在之后用到它。

### 构建镜像

此处构建镜像是为了后面使用 `helm` 安装 APISIX 做准备。

#### 编写 Dockerfile 文件

返回到路径 `/home/chever/api7/cloud_native/tasks/plugin-runner`，在该目录下建立一个 Dockerfile 文件，此处给出一个示范。

```dockerfile
ARG ENABLE_PROXY=false

# Build Apache APISIX
FROM api7/apisix-base:1.19.9.1.5

ADD ./apisix-go-plugin-runner /usr/local/apisix-go-plugin-runner

ARG APISIX_VERSION=2.13.1
LABEL apisix_version="${APISIX_VERSION}"

ARG ENABLE_PROXY
RUN set -x \
    && (test "${ENABLE_PROXY}" != "true" || /bin/sed -i 's,http://dl-cdn.alpinelinux.org,https://mirrors.aliyun.com,g' /etc/apk/repositories) \
    && apk add --no-cache --virtual .builddeps \
        build-base \
        automake \
        autoconf \
        make \
        libtool \
        pkgconfig \
        cmake \
        unzip \
        curl \
        openssl \
        git \
        openldap-dev \
    && luarocks install https://github.com/apache/apisix/raw/master/rockspec/apisix-${APISIX_VERSION}-0.rockspec --tree=/usr/local/apisix/deps PCRE_DIR=/usr/local/openresty/pcre \
    && cp -v /usr/local/apisix/deps/lib/luarocks/rocks-5.1/apisix/${APISIX_VERSION}-0/bin/apisix /usr/bin/ \
    && (function ver_lt { [ "$1" = "$2" ] && return 1 || [ "$1" = "`echo -e "$1\n$2" | sort -V | head -n1`" ]; };  if [ "$APISIX_VERSION" = "master" ] || ver_lt 2.2.0 $APISIX_VERSION; then echo 'use shell ';else bin='#! /usr/local/openresty/luajit/bin/luajit\npackage.path = "/usr/local/apisix/?.lua;" .. package.path'; sed -i "1s@.*@$bin@" /usr/bin/apisix ; fi;) \
    && mv /usr/local/apisix/deps/share/lua/5.1/apisix /usr/local/apisix \
    && apk del .builddeps \
    && apk add --no-cache \
        bash \
        curl \
        libstdc++ \
        openldap \
        tzdata \
    # forward request and error logs to docker log collector
    && ln -sf /dev/stdout /usr/local/apisix/logs/access.log \
    && ln -sf /dev/stderr /usr/local/apisix/logs/error.log

WORKDIR /usr/local/apisix

ENV PATH=$PATH:/usr/local/openresty/luajit/bin:/usr/local/openresty/nginx/sbin:/usr/local/openresty/bin

EXPOSE 9080 9443

CMD ["sh", "-c", "/usr/bin/apisix init && /usr/bin/apisix init_etcd && /usr/local/openresty/bin/openresty -p /usr/local/apisix -g 'daemon off;'"]

STOPSIGNAL SIGQUIT
```

这份 Dockerfile 配置文档，来源于这个[链接](https://github.com/apache/apisix-docker/blob/master/alpine/Dockerfile)。我做的唯一修改如下：

```bash
ARG ENABLE_PROXY=false

# Build Apache APISIX
FROM api7/apisix-base:1.19.9.1.5

ADD ./apisix-go-plugin-runner /usr/local/apisix-go-plugin-runner

ARG APISIX_VERSION=2.13.1
LABEL apisix_version="${APISIX_VERSION}"

ARG ENABLE_PROXY

```

将目录 `/home/chever/api7/cloud_native/tasks/plugin-runner` 下的 `/apisix-go-plugin-runner` 文件全部打包进 Docker 镜像。请记录下可执行文件的位置 `apisix-go-plugin-runner/cmd/go-runner/go-runner`，与上文 Dockerfile 中的 `/usr/local/apisix-go-plugin-runner` 目录位置，最终得出可执行文件在 Docker 镜像中的位置如下：

```bash
/usr/local/apisix-go-plugin-runner/cmd/go-runner/go-runner
```

请记录下这个地址。我们将在接下来的配置中使用到它。

#### 开始构建镜像

开始根据 Dockerfile 构建 Docker 镜像。命令执行目录于 `/home/chever/api7/cloud_native/tasks/plugin-runner`。命令如下：

```bash
docker build -t apisix/forrunner:0.1 .
```

命令解释：构建一个名字叫作 `apisix/forrunner` 的镜像，并将其标记为 0.1 版本。

#### 加载镜像到集群环境中

```bash
kind  load docker-image apisix/forrunner:0.1 
```

将镜像加载进 kind 集群环境中去，以便让之后 helm 安装的时候能拉取到这个自定义的镜像进行安装。

### helm 安装部署 Apisix Ingress

#### 修改官方包

本小节主要是修改 helm 官方包中的 `values.yaml` 文件，以使其可以安装本地打包的镜像以及正常运行 `go-plugin-runner` 可执行文件。

##### 拉取官方包

首先拉取最新的 apisix helm chart 包，命令如下：

```bash
helm fetch apisix/apisix
```

文件树如下：

```bash
chever@cloud-native-01:~/api7/cloud_native/tasks/plugin-runner$ tree -L 1
.
├── apisix-0.9.1.tgz
└── apisix-go-plugin-runner

1 directory, 1 file
```

##### 解压官方包

解压 `apisix-0.9.1.tgz` 文件，准备改写配置。解压命令如下：

```bash
tar zxvf apisix-0.9.1.tgz
```

得到文件树如下：

```bash
chever@cloud-native-01:~/api7/cloud_native/tasks/plugin-runner$ tree -L 1
.
├── apisix
├── apisix-0.9.1.tgz
└── apisix-go-plugin-runner

2 directories, 1 file
```

##### 修改 `values.yaml` 文件

进入`apisix` 文件夹，修改 `values.yaml` 文件。两处修改如下：

```yaml
image:
  repository: apisix/forrunner
  pullPolicy: IfNotPresent
  # Overrides the image tag whose default is the chart appVersion.
  tag: 0.1
```

第一处修改将helm 安装的镜像设置为本地自己打包的镜像。

```yaml
extPlugin:
  enabled: true
  cmd: ["/usr/local/apisix-go-plugin-runner/cmd/go-runner/go-runner", "run"]
```

第二处命令设置好运行容器后，go-runner 在容器中的位置。

##### 压缩修改后的包

配置好后，压缩 `apisix` 文件。压缩命令如下：

```bash
tar zcvf apisix.tgz apisix/
```

得到压缩文件，此时文件树如下：

```bash
chever@cloud-native-01:~/api7/cloud_native/tasks/plugin-runner$ tree -L 1
.
├── apisix
├── apisix-0.9.1.tgz
├── apisix-go-plugin-runner
└── apisix.tgz

2 directories, 2 files
```

#### 执行 helm 安装命令

##### 创建 namespace

在正式安装之前，先创建 namespaces，命令如下

```bash
kubectl create ns ingress-apisix
```

然后使用 helm 安装 APISIX，命令如下：

```bash
helm install apisix ./apisix.tgz --set gateway.type=NodePort --set ingress-controller.enabled=true --namespace ingress-apisix --set ingress-controller.config.apisix.serviceNamespace=ingress-apisix
```

### 创建 httpbin 服务以及 ApisixRoute 资源

创建 httpbin 后端资源，以配合部署的 ApisixRoute 资源运行测试功能是否正常生效。

#### 创建 httpbin 服务

创建一个 httpbin 服务，命令如下：

```bash
kubectl run httpbin --image kennethreitz/httpbin --port 80
```

将端口暴露出去，命令如下：

```bash
kubectl expose pod httpbin --port 80
```

#### 创建 ApisixRoute 资源

创建 `go-plugin-runner-route.yaml` 文件以开启 ApisixRoute 资源，配置文件如下：

```yaml
apiVersion: apisix.apache.org/v2beta3
kind: ApisixRoute
metadata:
  name: plugin-runner-demo
spec:
  http:
  - name: rule1
    match:
      hosts:
      - local.httpbin.org
      paths:
      - /get
    backends:
    - serviceName: httpbin
      servicePort: 80
    plugins:
    - name: ext-plugin-pre-req
      enable: true
      config:
        conf:
        - name: "say"
          value: "{\"body\": \"hello\"}"
```

创建资源命令如下：

```bash
kubectl apply -f go-plugin-runner-route.yaml
```

### 测试

测试 Golang 编写的插件是否正常运行，命令如下：

```bash
kubectl exec -it -n ${namespace of Apache APISIX} ${Pod name of Apache APISIX} -- curl http://127.0.0.1:9080/get -H 'Host: local.httpbin.org'
```

此处我根据 `kubectl get pods --all-namespaces` 命令得出这里的 `${namespace of Apache APISIX} ` 和 `${Pod name of Apache APISIX}` 参数分别为`ingress-apisix` 和 `apisix-55d476c64-s5lzw`，执行命令如下：

```bash
kubectl exec -it -n ingress-apisix apisix-55d476c64-s5lzw -- curl http://127.0.0.1:9080/get -H 'Host: local.httpbin.org'
```

得到的正常响应为：

```bash
chever@cloud-native-01:~/api7/cloud_native/tasks/plugin-runner$ kubectl exec -it -n ingress-apisix apisix-55d476c64-s5lzw -- curl http://127.0.0.1:9080/get -H 'Host: local.httpbin.org'
Defaulted container "apisix" out of: apisix, wait-etcd (init)
hello
```

## 总结

这篇文档的得来，是很不容易的。我学习了很多知识，dockerfile 打包镜像。helm chart 自定义。很痛苦，但是也很快乐。也知道了要注意打包的可执行
文件是静态链接还是应该动态链接

[Containerize Your Go Developer Environment – Part 1](https://www.docker.com/blog/containerize-your-go-developer-environment-part-1/): 看了但是没啥用

[kind load 打包镜像](https://kind.sigs.k8s.io/docs/user/quick-start/#:~:text=This%20allows%20a%20workflow%20like%3A)

[Dockerfile 中的 COPY 与 ADD 命令](https://www.cnblogs.com/sparkdev/p/9573248.html): 这个确实很有用啊！

[打开 httpbin 后端服务](https://apisix.apache.org/zh/docs/ingress-controller/practices/proxy-the-httpbin-service-with-ingress): 这个起到一点用处

[搭配上面一起使用](https://apisix.apache.org/zh/docs/ingress-controller/practices/proxy-the-httpbin-service/): 与上面的方法搭配使用，效果更佳

[APISIX Ingress issues: How to use apisix-python-plugin-runner](https://github.com/apache/apisix-ingress-controller/issues/921): 很有用哦！

[Helm 修改后该如何部署](https://cloud.tencent.com/developer/article/1604291#:~:text=%E6%9E%9C%E7%84%B6%E5%A2%9E%E5%8A%A0%E4%BA%86%EF%BC%9A-,%E7%AC%AC%E4%BA%8C%E7%A7%8D%E4%BF%AE%E6%94%B9%E6%96%B9%E5%BC%8F%EF%BC%9A%E6%94%B9helm%E7%9A%84%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6,-%E5%A6%82%E6%9E%9C%E6%9C%8D%E5%8A%A1%E8%BF%98): 这个也很有用！

[深入理解 Dockerfile 上下文](https://yeasy.gitbook.io/docker_practice/image/build#jing-xiang-gou-jian-shang-xia-wen-context)

[理解 Dockerfile 构建上下文](https://blog.csdn.net/qianghaohao/article/details/87554255)

[理解 FROM ...AS (Stackoverflow)](https://stackoverflow.com/questions/56645546/from-as-in-dockerfile-not-working-as-i-expect#:~:text=The%20FROM...,new%20stage%20of%20the%20build.)

[Docker 官方文档有不错的解释](https://docs.docker.com/language/golang/build-images/#create-a-dockerfile-for-the-application)

### 判错命令

此外，有一些帮助我判断状况的命令也非常需要记住，非常感谢哈：

查询日志

```bash
kubectl  logs apisix-5b9788797c-f8lrv -n ingress-apisix
```

查看pod 状态

```bash
kubectl describe pod  apisix-7cdf9cbf6f-gh5bw -n apisix
```

如果是 alpine 的容器，安装命令是

```bash
apk add file
```

进入到容器里，运行 file 命令，查看可执行文件的基本信息

```bash
file some_execuable
```
### 其他命令

```bash
helm uninstall apisix ./apisix.tgz
```

Upgrade 安装

```bash
helm upgrade --install apisix ./apisix.tgz --set gateway.type=NodePort --set ingress-controller.enabled=true --namespace ingress-apisix --set ingress-controller.config.apisix.serviceNamespace=ingress-apisix
```

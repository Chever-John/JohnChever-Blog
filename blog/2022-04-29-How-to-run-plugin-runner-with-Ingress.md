---
slug: HowToRunGoPluginRunnerInAPISIXIngress
title: How to run go plugin runner in APISIX Ingress
authors: CheverJohn
tags: [k8s, apisix, Ingress, docker]
---

# 如何在 APISIX Ingress 中使用 go-plugin-runner

## 开始

### 构建集群环境

首先构建本地集群环境，这边采用kind 构建集群环境。

命令如下：

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

如果你插件写完了的话，就可以在编译成可执行文件以搭配 APISIX 运行了。

这边可以选择很多种方式，你可以直接将这一过程编写进 Dockerfile 里。在 docker 构建镜像的时候完成编译可执行文件。也可以在构建 docker 镜像前，在本地编译可执行文件，我认为这一切都取决于你本地硬件的考量。这边为了加快速度，我选择先在本地编译，然后将文件复制到镜像中去。

这边选择一个默认的文件夹地址 `/home/chever/api7/cloud_native/tasks/plugin-runner`，并将我们的 `apisix-go-plugin-runner` 项目置于此文件夹下。

文件树如下所示：

```sh
chever@cloud-native-01:~/api7/cloud_native/tasks/plugin-runner$ tree -L 1
.
└── apisix-go-plugin-runner

1 directory, 0 files
```

然后你需要进入到 `apisix-go-plugin-runner/cmd/go-runner/plugins` 目录，并在该目录下编写你所需要的插件。本文章将使用默认插件 `say` 做演示。

```sh
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

运行打包编译命令

```sh
CGO_ENABLED=0 go build -a -ldflags '-extldflags "-static"' .
```

这样便成功打包了一个静态编译的 `go-runner` 可执行文件出来了。

在  `apisix-go-plugin-runner/cmd/go-runner/` 目录下，可以看到当前文件树是这样的

```sh
chever@cloud-native-01:~/api7/cloud_native/tasks/plugin-runner/apisix-go-plugin-runner/cmd/go-runner$ tree -L 1
.
├── go-runner
├── main.go
├── main_test.go
├── plugins
└── version.go

1 directory, 4 files
```

请记住 `apisix-go-plugin-runner/cmd/go-runner/go-runner` 这个相对路径，我们将在之后用到它。

### 编写 Dockerfile 文件

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

这份 Dockerfile 配置文档，来源于这个[链接](https://github.com/apache/apisix-docker/blob/master/alpine/Dockerfile)。

我做的唯一修改如下：

```sh
ARG ENABLE_PROXY=false

# Build Apache APISIX
FROM api7/apisix-base:1.19.9.1.5

ADD ./apisix-go-plugin-runner /usr/local/apisix-go-plugin-runner

ARG APISIX_VERSION=2.13.1
LABEL apisix_version="${APISIX_VERSION}"

ARG ENABLE_PROXY

```

将目录`/home/chever/api7/cloud_native/tasks/plugin-runner` 下的 `/apisix-go-plugin-runner` 文件全部打包进 Docker 镜像。并记录下可执行文件的位置 `apisix-go-plugin-runner/cmd/go-runner/go-runner`，联系到 Dockerfile 中的 `/usr/local/apisix-go-plugin-runner`，得出最终的可执行文件在 Docker 镜像中的位置应该是

```sh
/usr/local/apisix-go-plugin-runner/cmd/go-runner/go-runner
```

请记录下这个地址。我们将在接下来的配置中使用到它。



开始根据 Dockerfile 构建 Docker 镜像。命令如下：

```sh
docker build -t apisix/forrunner:0.1 .
```

命令解释：构建一个名字叫作 `apisix/forrunner` 的镜像，并将其标记为 0.1 版本。



```sh
kind  load docker-image apisix/forrunner:0.1 
```

将镜像加载进 kind 集群环境中去，以便让之后 helm 安装的时候能拉取到这个自定义的镜像进行安装。

### helm 安装自定义镜像

首先拉取最新的 apisix helm chart 包，命令如下：

```sh
helm fetch apisix/apisix
```

文件树如下：

```sh
chever@cloud-native-01:~/api7/cloud_native/tasks/plugin-runner$ tree -L 1
.
├── apisix-0.9.1.tgz
└── apisix-go-plugin-runner

1 directory, 1 file
```

解压 `apisix-0.9.1.tgz` 文件，准备改写配置。解压命令如下：

```sh
tar zxvf apisix-0.9.1.tgz
```

得到文件树如下：

```sh
chever@cloud-native-01:~/api7/cloud_native/tasks/plugin-runner$ tree -L 1
.
├── apisix
├── apisix-0.9.1.tgz
└── apisix-go-plugin-runner

2 directories, 1 file
```

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



配置好后，压缩 `apisix` 文件（之前解压缩然后得到修改的文件）。压缩命令如下：

```sh
tar zcvf apisix.tgz apisix/
```

得到压缩文件，此时文件树如下：

```sh
chever@cloud-native-01:~/api7/cloud_native/tasks/plugin-runner$ tree -L 1
.
├── apisix
├── apisix-0.9.1.tgz
├── apisix-go-plugin-runner
└── apisix.tgz

2 directories, 2 files
```

执行 helm 安装命令

在正式安装之前，先创建 namespaces

```sh
kubectl create ns ingress-apisix
```

然后使用 `helm` 安装 `APISIX`。命令如下：

```sh
helm install apisix ./apisix.tgz --set gateway.type=NodePort --set ingress-controller.enabled=true --namespace ingress-apisix --set ingress-controller.config.apisix.serviceNamespace=ingress-apisix
```



### 创建 httpbin 服务以及 ApisixRoute 资源

#### 创建 httpbin 服务

创建一个 httpbin 服务

```sh
kubectl run httpbin --image kennethreitz/httpbin --port 80
```

将端口暴露出去

```sh
kubectl expose pod httpbin --port 80
```

#### 创建 ApisixRoute 资源

给出资源示例：

将文件命名为 `go-plugin-runner-route.yaml`。

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

```sh
kubectl apply -f go-plugin-runner-route.yaml
```

### 测试测试 Golang 编写的插件是否正常运行

命令如下：

```sh
kubectl exec -it -n ${namespace of Apache APISIX} ${Pod name of Apache APISIX} -- curl http://127.0.0.1:9080/get -H 'Host: local.httpbin.org'
```

此处我根据 `kubectl get pods --all-namespaces` 命令得出这里的 `${namespace of Apache APISIX} ${Pod name of Apache APISIX}` 参数分别为`ingress-apisix` 和 `apisix-55d476c64-s5lzw`。

```sh
kubectl exec -it -n ingress-apisix apisix-55d476c64-s5lzw -- curl http://127.0.0.1:9080/get -H 'Host: local.httpbin.org'
```

得到的响应为：

```sh
chever@cloud-native-01:~/api7/cloud_native/tasks/plugin-runner$ kubectl exec -it -n ingress-apisix apisix-55d476c64-s5lzw -- curl http://127.0.0.1:9080/get -H 'Host: local.httpbin.org'
Defaulted container "apisix" out of: apisix, wait-etcd (init)
hello
```





# 使用 APISIX Ingress 运行 go-plugin-runner



## 首先搭建本地 cluster

命令如下：

```sh
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



## Dockerfile 构建 包含 go-plugin-runner 的镜像

使用的 Dockerfile 来自于此[链接](https://github.com/apache/apisix-docker/blob/master/alpine/Dockerfile)

我修改后的 Dockerfile 文件如下

```dockerfile
ARG ENABLE_PROXY=false

# Build Apache APISIX
FROM api7/apisix-base:1.19.9.1.5

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

COPY go-runner .

ENV PATH=$PATH:/usr/local/openresty/luajit/bin:/usr/local/openresty/nginx/sbin:/usr/local/openresty/bin

EXPOSE 9080 9443

CMD ["sh", "-c", "/usr/bin/apisix init && /usr/bin/apisix init_etcd && /usr/local/openresty/bin/openresty -p /usr/local/apisix -g 'daemon off;'"]

STOPSIGNAL SIGQUIT
```

**我只修改了

需要注意，此处我只将 go-plugin-runner 的二进制文件打包进镜像。目录位置如下。

```sh
// 文件目录
chever@cloud-native-01:~/api7/cloud_native/tasks/plugin-runner$ ll
total 8444
drwxrwxr-x  5 chever chever    4096 Apr 27 13:38 ./
drwxrwxr-x  7 chever chever    4096 Apr 26 03:42 ../
-rw-rw-r--  1 chever chever    2758 Apr 27 13:20 Dockerfile
drwxrwxr-x  4 chever chever    4096 Apr 27 07:59 apisix/
-rw-r--r--  1 chever chever   73386 Apr 27 08:02 apisix-0.9.1.tgz
drwxrwxr-x 10 chever chever    4096 Apr 27 09:21 apisix-go-plugin-runner/
-rw-rw-r--  1 chever chever   74780 Apr 27 13:38 apisix.tgz
-rwxrwxr-x  1 chever chever 8442425 Apr 27 03:39 go-runner*
```

最下面的文件即是我所打包成的 go-plugin-runner 的镜像。

第三行即是我所
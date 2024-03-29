---
slug: HowToRunGoPluginRunnerInAPISIXIngressEn
title: How to run go plugin runner in APISIX Ingress
authors: CheverJohn
tags: [k8s, apisix, Ingress, docker]
---
# How to use go-plugin-runner in APISIX Ingress

## Background Description

While wandering around the community, I found a user confused about "how to use multilingual plugins in APISIX Ingress environment". I happen to be a user of go-plugin-runner and have a little knowledge of the APISIX Ingress project, so this document was born.

<!--truncate-->
## Proposal Description

Based on version 0.3 of the go-plugin-runner plugin and version 1.4.0 of APISIX Ingress, this article goes through building the cluster, building the image, customizing the helm chart package, and finally, deploying the resources. It is guaranteed that the final result can be derived in full based on this documentation.

```bash
go-plugin-runner: 0.3
APISIX Ingress: 1.4.0

kind: kind v0.12.0 go1.17.8 linux/amd64
kubectl version: Client Version: v1.23.5/Server Version: v1.23.4
golang: go1.18 linux/amd64
```

## Begin

### Build a cluster environment

Select `kind` to build a local cluster environment. The command is as follows:

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

### Build the go-plugin-runner executable

If you have finished writing the plugin, you can start compiling the executable to run with APISIX.

This article recommends two packaging build options.

1. put the packaging process into the Dockerfile and finish the compilation process when you build the docker image later.
2. You can also follow the scheme used in this document, building the executable first and then copying the packaged executable to the image.

How you choose the option should depend on your local hardware considerations. The reason for selecting the second option here is that I want to rely on my powerful local hardware to increase the building speed and speed up the process.

### Go to the go-plugin-runner directory

Choose a folder address `/home/chever/api7/cloud_native/tasks/plugin-runner` and place our `apisix-go-plugin-runner` project in this folder.

After successful placement, the file tree is shown below:

```bash
chever@cloud-native-01:~/api7/cloud_native/tasks/plugin-runner$ tree -L 1
.
└── apisix-go-plugin-runner

1 directory, 0 files
```

Then you need to go to the `apisix-go-plugin-runner/cmd/go-runner/plugins` directory and write the plugins you need in that directory. This article will use the default plugin `say` for demonstration purposes.

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

After writing the plugins, start compiling the executable formally, and note here that you should build static executables, not dynamic ones.

The package compile command is as follows.

```bash
CGO_ENABLED=0 go build -a -ldflags '-extldflags "-static"' .
```

This successfully packages a statically compiled `go-runner` executable.

In the `apisix-go-plugin-runner/cmd/go-runner/` directory, you can see that the current file tree looks like this:

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

Please remember the path `apisix-go-plugin-runner/cmd/go-runner/go-runner`, we will use it later.

### Build Docker Image

The image is built here in preparation for installing APISIX later using `helm`.

#### Write Dockerfile

Return to the path `/home/chever/api7/cloud_native/tasks/plugin-runner` and create a Dockerfile in that directory, a demonstration of which is given here.

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

Package all the `/apisix-go-plugin-runner` files in the `/home/chever/api7/cloud_native/tasks/plugin-runner` directory into a Docker image. Note down the location of the executable `apisix-go-plugin-runner/cmd/go-runner/go-runner` and the location of the `/usr/local/apisix-go-plugin-runner` directory in the Dockerfile above to get the final location of the executable in the Docker image is located as follows.

```bash
/usr/local/apisix-go-plugin-runner/cmd/go-runner/go-runner
```

Please make a note of this address. We will use it in the rest of the configuration.

#### Begin to build Docker Image

Start building a Docker image based on the Dockerfile. The command is executed in the `/home/chever/api7/cloud_native/tasks/plugin-runner` directory. The command is as follows:

```bash
docker build -t apisix/forrunner:0.1 .
```

Command Explanation: Build an image with the name `apisix/forrunner` and mark it as version 0.1.

#### Load the image to the cluster environment

```bash
kind  load docker-image apisix/forrunner:0.1 
```

Load the image into the kind cluster environment to pull the custom local image for installation during the helm installation.

### Install APISIX Ingress

#### Customize the helm chart

This section focuses on modifying the `values.yaml` file in the official helm package so that it can install locally packaged images and run the `go-plugin-runner` executable properly.

##### Fetch Official helm chart

First, fetch the latest apisix helm chart package with the following command:

```bash
helm fetch apisix/apisix
```

The file tree is as follows:

```bash
chever@cloud-native-01:~/api7/cloud_native/tasks/plugin-runner$ tree -L 1
.
├── apisix-0.9.1.tgz
└── apisix-go-plugin-runner

1 directory, 1 file
```

##### Unzip

Unzip the `apisix-0.9.1.tgz` file and prepare to rewrite the configuration. The unzip command is as follows.

```bash
tar zxvf apisix-0.9.1.tgz
```

The file tree is as follows:

```bash
chever@cloud-native-01:~/api7/cloud_native/tasks/plugin-runner$ tree -L 1
.
├── apisix
├── apisix-0.9.1.tgz
└── apisix-go-plugin-runner

2 directories, 1 file
```

##### Change `values.yaml`

Go to the `apisix` folder and modify the `values.yaml` file. The two changes are as follows:

```yaml
image:
  repository: apisix/forrunner
  pullPolicy: IfNotPresent
  # Overrides the image tag whose default is the chart appVersion.
  tag: 0.1
```

The first change sets the image for the helm installation to be a locally packaged image of your own.

```yaml
extPlugin:
  enabled: true
  cmd: ["/usr/local/apisix-go-plugin-runner/cmd/go-runner/go-runner", "run"]
```

The second change sets the position of go-runner in the container after running the container.

##### Compress the modified helm chart

Once configured, compress the `apisix` file. The compression command is as follows:

```bash
tar zcvf apisix.tgz apisix/
```

The compressed file is obtained, at which point the file tree is as follows:

```bash
chever@cloud-native-01:~/api7/cloud_native/tasks/plugin-runner$ tree -L 1
.
├── apisix
├── apisix-0.9.1.tgz
├── apisix-go-plugin-runner
└── apisix.tgz

2 directories, 2 files
```

#### Execute the helm install command

##### Create namespace

Before installation, create namespaces with the following command:

```bash
kubectl create ns ingress-apisix
```

Then install APISIX using helm with the following command:

```bash
helm install apisix ./apisix.tgz --set gateway.type=NodePort --set ingress-controller.enabled=true --namespace ingress-apisix --set ingress-controller.config.apisix.serviceNamespace=ingress-apisix
```

### Create httpbin service and ApisixRoute resources

Create an httpbin backend resource to run with the deployed ApisixRoute resource to test that the functionality is working correctly.

#### Create httpbin service

Create an httpbin service with the following command:

```bash
kubectl run httpbin --image kennethreitz/httpbin --port 80
```

Expose the port with the following command:

```bash
kubectl expose pod httpbin --port 80
```

#### Create ApisixRoute Resource

Create the `go-plugin-runner-route.yaml` file to enable the ApisixRoute resource, with the following configuration file:

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

The create resource command is as follows:

```bash
kubectl apply -f go-plugin-runner-route.yaml
```

### Test

The command is as follows to test if the plugin written in Golang is working correctly:

```bash
kubectl exec -it -n ${namespace of Apache APISIX} ${Pod name of Apache APISIX} -- curl http://127.0.0.1:9080/get -H 'Host: local.httpbin.org'
```

Here I derived from the `kubectl get pods --all-namespaces` command that the `${namespace of Apache APISIX}` and `${Pod name of Apache APISIX}` parameters here are `ingress-apisix` and `apisix- 55d476c64-s5lzw`, execute the command as follows:

```bash
kubectl exec -it -n ingress-apisix apisix-55d476c64-s5lzw -- curl http://127.0.0.1:9080/get -H 'Host: local.httpbin.org'
```

The expected response obtained is:

```bash
chever@cloud-native-01:~/api7/cloud_native/tasks/plugin-runner$ kubectl exec -it -n ingress-apisix apisix-55d476c64-s5lzw -- curl http://127.0.0.1:9080/get -H 'Host: local.httpbin.org'
Defaulted container "apisix" out of: apisix, wait-etcd (init)
hello
```

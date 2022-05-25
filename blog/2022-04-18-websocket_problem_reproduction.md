---
slug: Websocket & K8s
title: 从 websocket 熟悉 k8s 以及 APISIX-Ingress
authors: CheverJohn
tags: [k8s, Apache APISIX Ingress, websocket]
---

# HI, This issue has been solved in the latest version

My env:

```sh
kubectl version: Client Version: v1.23.5   Server Version: v1.23.4
kind version: kind v0.12.0 go1.17.8 linux/amd64
helm version: version.BuildInfo{Version:"v3.8.1", GitCommit:"5cb9af4b1b271d11d7a97a71df3ac337dd94ad37", GitTreeState:"clean", GoVersion:"go1.17.5"}
ingress version: 
```

<!--truncate-->
I will describe my successful recurrence process as follows.


## Install APISIX Ingress

### Config APISIX Cluster

Commands as follows:

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

### Install APISIX Ingress

commands as follows:

```sh
helm repo add apisix https://charts.apiseven.com
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
kubectl create ns ingress-apisix
helm install apisix apisix/apisix \
  --set gateway.type=NodePort \
  --set ingress-controller.enabled=true \
  --namespace ingress-apisix \
  --set ingress-controller.config.apisix.serviceNamespace=ingress-apisix
kubectl get service --namespace ingress-apisix
```


## Enable web-socket backend service

You can refer to this [link](https://apisix.apache.org/zh/docs/ingress-controller/practices/proxy-the-httpbin-service) for more information.

```sh
// pull image jmalloc/echo-server
kubectl run websocket-server --image jmalloc/echo-server --port 8080

// expose pod
kubectl expose pod websocket-server --port 8080

// check the service
kubectl get service websocket-server
```

## Create a resource

create a `websocket.yaml`

```yaml
apiVersion: apisix.apache.org/v2beta3
kind: ApisixRoute
metadata:
  name: ws-route
spec:
  http:
  - name: websocket
    match:
      hosts:
      - ws.foo.org
      paths:
      - /*
    websocket: true
    backends:
       - serviceName: websocket-server
         servicePort: 8080
```

```sh
kubectl apply -f websock.yaml
```

## Test

```sh
kubectl exec -it -n ingress-apisix apisix-cfcdc4999-7jq8l -- curl http://127.0.0.1:9180/apisix/admin/routes -H 'X-API-Key: edd1c9f034335f136f87ad84b625c8f1'

kubectl exec -it -n ingress-apisix apisix-cfcdc4999-7jq8l -- curl http://127.0.0.1:9080/headers -H 'Host: ws.foo.org'
```

Then you will see:

```sh
chever@cloud-native-01:~/api7/cloud_native/websock$ kubectl exec -it -n ingress-apisix apisix-cfcdc4999-7jq8l -- curl http://127.0.0.1:9080/headers -H 'Host: ws.foo.org'
Defaulted container "apisix" out of: apisix, wait-etcd (init)
Request served by websocket-server
 
HTTP/1.1 GET /headers

Host: ws.foo.org
X-Forwarded-Host: ws.foo.org
X-Forwarded-Port: 9080
User-Agent: curl/7.79.1
Accept: */*
X-Real-Ip: 127.0.0.1
X-Forwarded-For: 127.0.0.1
X-Forwarded-Proto: http
```


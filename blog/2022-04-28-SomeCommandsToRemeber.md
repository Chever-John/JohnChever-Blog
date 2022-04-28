---
slug: DockerAndBuildAndk8sAndIngressAndAPISIX
title: Docker build k8s ingress apisix
authors: CheverJohn
tags: [k8s, apisix, Ingress, docker]
---

kind create cluster

kubectl create ns apisix

// for reference. from link: https://cloud.tencent.com/developer/article/1604291
helm install --name-template my-jenkins -f values.yaml . --namespace helm-jenkins

helm install apisix apisix/apisix \
  --set gateway.type=NodePort \
  --set ingress-controller.enabled=true \
  --namespace ingress-apisix \
  --set ingress-controller.config.apisix.serviceNamespace=ingress-apisix

helm install --name-template apisix -f values.yaml \
  --set gateway.type=NodePort \
  --set ingress-controller.enabled=true \
  --namespace ingress-apisix \
  --set ingress-controller.config.apisix.serviceNamespace=ingress-apisix

helm install --name-template apisix -f values.yaml . --namespace ingress-apisix

kubectl create ns ingress-apisix
helm install apisix ./apisix.tgz --set gateway.type=NodePort --set ingress-controller.enabled=true --namespace ingress-apisix --set ingress-controller.config.apisix.serviceNamespace=ingress-apisix
helm uninstall apisix ./apisix.tgz


apisix-6d98964d59-srbts

kubectl exec -it -n ingress-apisix apisix-6d98964d59-srbts -- curl http://127.0.0.1:9080/apisix/admin/routes/1 -H 'X-API-KEY: edd1c9f034335f136f87ad84b625c8f1' -X PUT -d '{
  "uri": "/get",
  "plugins": {
    "ext-plugin-pre-req": {
      "conf": [
        {"name":"say", "value":"{\"body\":\"hello\"}"}
      ]
    }
  },
  "upstream": {
        "type": "roundrobin",
        "nodes": {
            "127.0.0.1:1980": 1
        }
    }
}'

kubectl exec -it -n ingress-apisix apisix-6d98964d59-srbts -- curl http://127.0.0.1:9080/headers -H 'Host: local.httpbin.org'
kubectl exec -it -n ingress-apisix apisix-6d98964d59-srbts -- /bin/bash

// 使用 helm 先下载压缩包然后修改 value.yaml 之后再安装 apisix
helm fetch apisix/apisix

// 解压缩包修改 value.yaml 再压缩回来
tar zxvf apisix-0.9.1.tgz 这个是最新版
------- 修改一些数据 -------
tar zcvf apisix.tgz apisix/

// 使用 helm 安装 apisix
helm install apisix ./apisix-0.9.1.tgz --set gateway.type=NodePort --set ingress-controller.enabled=true --namespace ingress-apisix --set ingress-controller.config.apisix.serviceNamespace=ingress-apisix
helm install apisix ./apisix.tgz --set gateway.type=NodePort --set ingress-controller.enabled=true --namespace ingress-apisix --set ingress-controller.config.apisix.serviceNamespace=ingress-apisix
helm uninstall apisix ./apisix.tgz

helm upgrade --install apisix ./apisix.tgz --set gateway.type=NodePort --set ingress-controller.enabled=true --namespace ingress-apisix --set ingress-controller.config.apisix.serviceNamespace=ingress-apisix

// 卸载 helm 安装的 apisix
chever@cloud-native-01:~/api7/cloud_native/tasks/plugin-runner$ helm list --all-namespaces
NAME    NAMESPACE       REVISION        UPDATED                                 STATUS          CHART           APP VERSION
apisix  ingress-apisix  1               2022-04-27 03:59:50.263841758 +0000 UTC deployed        apisix-0.9.1    2.13.1


helm uninstall apisix --namespace ingress-apisix

// 测试是否正常
kubectl exec -it -n ingress-apisix apisix-6d98964d59-m5pwt -- curl http://127.0.0.1:9180/apisix/admin/routes -H 'X-API-Key: edd1c9f034335f136f87ad84b625c8f1'
kubectl exec -it -n ingress-apisix apisix-6d98964d59-m5pwt -- curl http://127.0.0.1:9080/headers -H 'Host: local.httpbin.org'

apisix-6d98964d59-m5pwt


// 测试 go-plugin-runner 资源是否正常
kubectl exec -it -n ingress-apisix apisix-6d98964d59-m5pwt -- curl http://127.0.0.1:9080/get -H 'Host: plugin.runner.org'

kubectl describe pod  apisix-7cdf9cbf6f-gh5bw -n apisix


curl http://127.0.0.1:9080/apisix/admin/routes/1 -H 'X-API-KEY: edd1c9f034335f136f87ad84b625c8f1' -X PUT -d '
{
  "uri": "/get",
  "plugins": {
    "ext-plugin-pre-req": {
      "conf": [
        {"name":"say", "value":"{\"body\":\"hello\"}"}
      ]
    }
  },
  "upstream": {
        "type": "roundrobin",
        "nodes": {
            "127.0.0.1:1980": 1
        }
    }
}
'

docker build -t apisix/forrunner .
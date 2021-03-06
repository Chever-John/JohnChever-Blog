---
slug: Observability and Prometheus
title: Observability and Prometheus
authors: CheverJohn
tags: [k8s, Observability]
---

Observability (monitoring functionality) has always played an important role in system maintenance. A good monitoring system can help engineers quickly understand the status of services running in production environments and can locate problems or give early warning of anomalies when they occur.

Prometheus is a leading open-source project focused on metrics and alerting that has changed the way the world does monitoring and observability. And Apache APISIX Ingress Controller has enhanced its support for Prometheus Metrics in recent releases, adding a new feature for use in conjunction with the `public-api` plugin. This article will introduce how to configure `public-api` to protect **Prometheus** to collect Apache APISIX Ingress Controller's Metrics data.

<!--truncate-->
## Initial Knowledge about `public-api`

When users develop custom plugins in Apache APISIX, they can define some APIs (hereinafter referred to as public API) for the plugins. In practical application scenarios, the provided interface is for internal calls, rather than being open on the public network for anyone to call.

Therefore, Apache APISIX has designed a `public-api` plugin. With this plugin, you can solve the pain points of using the public API. You can set a custom URI for the public API and configure any type of plugin. For more information about `public-api`, see the [public-api](https://apisix.apache.org/docs/apisix/plugins/public-api/) plugin's document.

The main role of the `public-api` plugin in this document is to protect the URI exposed by Prometheus.

**Note**: One thing we should note is that this feature is only available in APISIX version 2.13 and later.



## Begin to access Apache APISIX Prometheus Metrics

### Step1: Install APISIX Ingress Controller

First, we deploy Apache APISIX, ETCD, and APISIX Ingress Controller to a local Kubernetes cluster via Helm.

```sh
helm repo add apisix https://charts.apiseven.com
helm repo update
kubectl create namespace ingress-apisix
helm install apisix apisix/apisix --namespace ingress-apisix \
 --set ingress-controller.enabled=true
```

After installation, please wait until all services are up and running. Specific status confirmation can be checked with the following command.

```sh
kubectl get all -n ingress-apisix
```

### Step 2: Enable Prometheus Plugin

If you need to monitor Apache APISIX at the same time, you can create the following ApisixClusterConfig resource.

```yaml
apiVersion: apisix.apache.org/v2beta3
kind: ApisixClusterConfig
metadata:
  name: default
spec:
  monitoring:
    prometheus:
      enable: true
```



### Step 3: Enable `public-api` Plugin

This is a basic routing setup, please note that further configuration should be done based on your local backend service information. The main solution concept is to use the `public-api` plugin to protect the routes exposed by **Prometheus**. For a more detailed configuration, you can refer to the [example](https://apisix.apache.org/zh/docs/apisix/plugins/public-api/#example) section of the `public-api` plugin.

```yaml
apiVersion: apisix.apache.org/v2beta3
kind: ApisixRoute
metadata:
  name: prometheus-route
spec:
  http:
  - name: public-api
    match:
      hosts:
      - test.prometheus.org
      paths:
      - /apisix/prometheus/metrics
    backends:
    ## Please notice that there must be your actual "serviceName" and "servicePort"
    - serviceName: apisix-test-prometheus
      servicePort: 9180
    plugins:
    - name: public-api
      enable: true
```



### Step 4: Collect the Metrics

Now you can then get the indicator parameters by requesting command access.

```sh
kubectl exec -it -n ${namespace of Apache APISIX} ${Pod name of Apache APISIX} -- curl http://127.0.0.1:9180/apisix/admin/routes -H 'X-API-Key: edd1c9f034335f136f87ad84b625c8f1'

kubectl exec -it -n ${namespace of Apache APISIX} ${Pod name of Apache APISIX} -- curl http://127.0.0.1:9080/headers -H 'Host: test.prometheus.org'
```


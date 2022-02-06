---
slug: 基础命令_graphql在APISIX中的应用
title: 基础命令_graphql在APISIX中的应用
authors: CheverJohn
tags: [APISIX, GraphQL]
---
# 基础命令_graphql在APISIX中的应用
> 2022年2月6日，水一天
## 基础命令

### 路由规则配置

**# basic Apache APISIX config**

```shell
curl http://127.0.0.1:9080/apisix/admin/routes/11 -H 'X-API-KEY: edd1c9f034335f136f87ad84b625c8f1' -X PUT -i -d '
{
  "methods": ["POST"],
  "uri": "/graphql",
  "vars": [
    ["graphql_operation", "==", "query"],
    ["graphql_name", "==", "getRepo"],
    ["graphql_root_fields", "has", "owner"]
  ],
  "upstream": {
    "type": "roundrobin",
    "nodes": {
      	"127.0.0.1:1980": 1
    }
  }
}'
```

反馈

一般在我之前的OpenResty中正常配置好1980服务器后，我配置APISIX路由正确之后会返回如下的信息

```shell
HTTP/1.1 200 OK
Date: Fri, 04 Feb 2022 22:00:03 GMT
Content-Type: application/json
Transfer-Encoding: chunked
Connection: keep-alive
Server: APISIX/2.10.3
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: *
Access-Control-Max-Age: 3600

{"action":"set","node":{"value":{"update_time":1644012003,"create_time":1642620298,"methods":["POST"],"uri":"\/graphql","priority":0,"upstream":{"hash_on":"vars","scheme":"http","type":"roundrobin","nodes":{"127.0.0.1:1980":1},"pass_host":"pass"},"vars":[["graphql_operation","==","query"],["graphql_name","==","getRepo"],["graphql_root_fields","has","owner"]],"id":"11","status":1},"key":"\/apisix\/routes\/11"}}
```

### 简单请求

**# basic request**

```shell
curl -X POST http://127.0.0.1:9080/graphql -d '
query getRepo {
    owner {
        name
    }
    repo {
        created
    }
}'
```

反馈

当APISIX路由配置正确之后，请求一个基础请求

```shell
---Headers
x-real-ip:127.0.0.1
host:127.0.0.1:9080
x-forwarded-proto:http
x-forwarded-host:127.0.0.1
x-forwarded-port:9080
content-length:82
content-type:application/x-www-form-urlencoded
accept:*/*
user-agent:curl/7.29.0
x-forwarded-for:127.0.0.1
---Args
---URI
/graphql
---Service Node
Centos-port: 1980
```

## 进阶操作

简单记一下逻辑，其实就是不断配置APISIX的路由规则，以下两个实际的配置代码

### 配置代码一

```shell
curl http://127.0.0.1:9080/apisix/admin/routes/11 -H 'X-API-KEY: edd1c9f034335f136f87ad84b625c8f1' -X PUT -i -d '
{
    "methods": ["POST"],
    "uri": "/graphql",
    "vars": [
        ["graphql_operation", "==", "query"],
        ["graphql_name", "==", "getRepo"],
        ["graphql_root_fields", "has", "owner"]
    ],
    "upstream": {
        "type": "roundrobin",
        "nodes": {
            "127.0.0.1:1980": 1,
	    	"127.0.0.1:1981": 1
        }
    }
}'
```

这边配置了两个upstream服务器，权重都设置为1，一个等级，这里边2的权重大于1。

### 配置代码二

```shell
curl http://127.0.0.1:9080/apisix/admin/routes/11 -H 'X-API-KEY: edd1c9f034335f136f87ad84b625c8f1' -X PUT -i -d '
{
    "methods": ["POST"],
    "uri": "/graphql",
    "vars": [
        ["graphql_operation", "==", "query"],
        ["graphql_name", "==", "getRepo111"],
        ["graphql_root_fields", "has", "owner"]
    ],
    "upstream": {
        "type": "roundrobin",
        "nodes": {
            "127.0.0.1:1980": 1
        }
    }
}'
```

第二个upstream服务器配置 graphql_name为`getRepo222`

```shell
curl http://127.0.0.1:9080/apisix/admin/routes/11 -H 'X-API-KEY: edd1c9f034335f136f87ad84b625c8f1' -X PUT -i -d '
{
    "methods": ["POST"],
    "uri": "/graphql",
    "vars": [
        ["graphql_operation", "==", "query"],
        ["graphql_name", "==", "getRepo222"],
        ["graphql_root_fields", "has", "owner"]
    ],
    "upstream": {
        "type": "roundrobin",
        "nodes": {
	    	"127.0.0.1:1981": 1
        }
    }
}'
```

然后我们可以根据不同的graphql query来进行不同的匹配，即泽轩大佬说的

> 泽轩：Apache APISIX 还可以针对不同的 graphql_operation 进行不同的权限校验、针对不同的 graphql_name 转发到不同的 upstream。

开始 query

```shell
curl -i -X POST http://127.0.0.1:9080/graphql -d '
query getRepo111 {
    owner {
        name
    }
    repo {
        created
    }
}'
```

上面的query 转发到了1980 端口的 graphql server上

```shell
curl -i -X POST http://127.0.0.1:9080/graphql -d '
query getRepo222 {
    owner {
        name
    }
    repo {
        created
    }
}'
```

上面的 query 转发到了 1981 端口的 graphql server上

就是这样，先简单做一下，明天再写详细一点。

这边可能对APISIX的 upstream 配置有点问题，所以暂停一下。
> 两条规则是可以并存哦？记得要用不同的ID



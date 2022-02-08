---
slug: 基础命令_graphql在APISIX中的应用
title: 基础命令_graphql在APISIX中的应用（代码向）
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

### 体现 roundrobin 均衡策略

> 简单记一下逻辑，其实就是不断配置APISIX的路由规则

这边 `upstream` 里配置了分别架设在 OpenResty 上端口为 1980 和 1981 的两个 `node` 

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

两个服务器的权重都设置为 1，一个等级，这里边 2 的权重大于 1。

然后分别发出请求的话，会按照顺序，1 > 2 > 1 > 2 > 1......的顺序得到 `upstream` 服务器的响应。

### 根据 graphql_name 匹配 upstream 服务器

#### 错误示范

这一串是给第一个 upstream 服务器配置 graphql_name 为getRepo111

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

第二个 upstream 服务器配置 graphql_name 为 getRepo222 

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

然后我们可以根据不同的 graphql query 来进行不同的匹配，即泽轩大佬说的

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

上面的 query 转发到了 1981 端口的 graphql server 上

就是这样，先简单做一下，明天再写详细一点。

这边可能对APISIX的 upstream 配置有点问题，所以暂停一下。

> 如果你这样设置，会遇到一个很明显的问题，后边的配置会覆盖掉前面的配置。
>
> 主要原因是 upstream 应该分组！接下来开始正式的工作

#### 成功示范

##### 对第一个 upstream 服务器的配置

首先创建一个上游 upstream 对象：

```shell
curl http://127.0.0.1:9080/apisix/admin/upstreams/1 -H 'X-API-KEY: edd1c9f034335f136f87ad84b625c8f1' -X PUT -d '
{
    "type": "chash",
    "key": "remote_addr",
    "nodes": {
        "127.0.0.1:1980": 1
    }
}'  
```

上游 upstream 对象创建后，均可以被具体  `Route` 或者 `Service` 引用，例如：

```shell
curl http://127.0.0.1:9080/apisix/admin/routes/1 -H 'X-API-KEY: edd1c9f034335f136f87ad84b625c8f1' -X PUT -i -d '
{
    "methods": ["POST"],
    "uri": "/graphql",
    "vars": [
        ["graphql_operation", "==", "query"],
        ["graphql_name", "==", "getRepo111"],
        ["graphql_root_fields", "has", "owner"]
    ],    
    "upstream_id": "1"
}' 
```

这里边我稍微解释一下，其中 `curl http://127.0.0.1:9080/apisix/admin/routes/1` 之后最后的 `1`，我认为就是 `"upstream_id": "1"`。因为从源码中解析 curl 请求的那个函数来看，就应该是这样的，如果有错误，可以来找我哈。

然后进行最后的正式请求：

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

得到正确的响应：

```shell
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Date: Mon, 07 Feb 2022 22:57:24 GMT
Server: APISIX/2.10.3

---Headers
x-forwarded-port:9080
content-length:85
user-agent:curl/7.29.0
accept:*/*
content-type:application/x-www-form-urlencoded
host:127.0.0.1:9080
x-real-ip:127.0.0.1
x-forwarded-for:127.0.0.1
x-forwarded-proto:http
x-forwarded-host:127.0.0.1
---Args
---URI
/graphql111
---Service Node
Centos-port: 1980
John Chever's 1980 port is working......
```

完成第一个 upstream 上游服务器的配置了。

##### 对第二个 upstream 服务器的配置

首先创建一个上游 upstream 对象：

```shell
curl http://127.0.0.1:9080/apisix/admin/upstreams/2 -H 'X-API-KEY: edd1c9f034335f136f87ad84b625c8f1' -X PUT -d '
{
    "type": "chash",
    "key": "remote_addr",
    "nodes": {
        "127.0.0.1:1981": 1
    }
}'
```

上游 upstream 对象创建后，均可以被具体  `Route` 或者 `Service` 引用，例如：

```shell
curl http://127.0.0.1:9080/apisix/admin/routes/2 -H 'X-API-KEY: edd1c9f034335f136f87ad84b625c8f1' -X PUT -i -d '
{
    "methods": ["POST"],
    "uri": "/graphql",
    "vars": [
        ["graphql_operation", "==", "query"],
        ["graphql_name", "==", "getRepo222"],
        ["graphql_root_fields", "has", "owner"]
    ],
    "upstream_id": 2
}'
```

然后进行最后的正式请求：

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

得到正确的响应：

```shell
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Date: Mon, 07 Feb 2022 23:04:44 GMT
Server: APISIX/2.10.3

---Headers
x-forwarded-port:9080
content-length:85
user-agent:curl/7.29.0
accept:*/*
content-type:application/x-www-form-urlencoded
host:127.0.0.1:9080
x-real-ip:127.0.0.1
x-forwarded-for:127.0.0.1
x-forwarded-proto:http
x-forwarded-host:127.0.0.1
---Args
---URI
/graphql222
---Service Node
Centos-port: 1981
John Chever's 1981 port is working......
```

##### 小结

这样配置好，就可以根据不同的 `graphql_name` 来匹配不同的上游 upstream 啦。


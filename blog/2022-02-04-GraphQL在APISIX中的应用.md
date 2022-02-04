# 基础命令_graphql在APISIX中的应用

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


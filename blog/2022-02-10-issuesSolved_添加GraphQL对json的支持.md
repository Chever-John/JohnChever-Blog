解决一个 issues 的过程

> 本篇博客，详细讲述一个 issues 的解决过程，享受解决问题的快乐吧:)

## 起源

当我浏览我关注的 Apache APISIX 社区的时候，发现了一个非常符合我的 issues。这是一个关于 GraphQL 的issues，正好我有关于 GraphQL 的了解，便想着接下这个 issues 以锻炼自己的能力叭。

接下来讲述发现的过程：

### issue 详情

看到 [issue](https://github.com/apache/apisix/issues/6266) （标题为 `bug: ctx.lua#59 parse_graphql(ctx) #6266` )，我刚开始看 issues 的时候，还以为是这位老哥不会使用 APISIX ，居然在发送请求的时候漏掉 `-X POST` （没想到最后还是我格局小了）

首先看 [issue 的描述](https://github.com/apache/apisix/issues/6266#:~:text=2%20days%20ago-,Issue%20description,-use%20whole%20request)

> use whole request body to parse graphql will get parse error.
> graphql request body is json , example :`{"query":"query{getUser{name age}}","variables":null}`, 
>
> ```sql
> {"query":
> 	"query{
> 		getUser{
> 			name age
> 		}
> 	}",
> 	"variables":null
> }
> ```
>
> not `query{getUser{name age}}`
>
> ```sql
> query{
> 	getUser{
> 		name 
> 		age
> 	}
> }
> ```
>
> 

我简单描述一下，这个问题就是说当他使用请求体为 json 的请求时，出现 `parse error` 的问题。

这边还是要抽自己一下，他都明确说了，没有用 query 的方式，我还在后边用我的 query 跟他解释，离谱，我该反省~

```shell
curl -X POST http://127.0.0.1:9080/graphql -d '
query getUser {
    owner {
        name
    }
    repo {
        created
    }
}'
```

他给出了自己的环境配置

#### Environment

- apisix version (cmd: `apisix version`): `apache/apisix:2.12.0-alpine`
- OS (cmd: `uname -a`): `docker`
- OpenResty / Nginx version (cmd: `nginx -V` or `openresty -V`): null
- etcd version, if have (cmd: run `curl http://127.0.0.1:9090/v1/server_info` to get the info from server-info API): `bitnami/etcd:3.4.15`
- apisix-dashboard version, if have: `apache/apisix-dashboard:2.10.1-alpine`

然后他给出了自己的复现过程

#### Reproduce

1. define graphql

```sql
query {
    getUser:User
}

type User{
    name:String
    age:String
}
```

2. add route

```shell
curl http://127.0.0.1:9080/apisix/admin/routes/1 -H 'X-API-KEY: edd1c9f034335f136f87ad84b625c8f1' -X PUT -i -d '
{
    "methods": ["POST"],
    "uri": "/graphql",
    "vars": [
        ["graphql_operation", "==", "query"],
        ["graphql_name", "==", "getUser"]
    ],
    "upstream": {
        "type": "roundrobin",
        "nodes": {
            "127.0.0.1:1980": 1
        }
    }
}'
```

3. perform graphql request by curl

```shell
curl 'http://127.0.0.1:9080/graphql' \
  -H 'Content-Type: text/plain;charset=UTF-8' \
  -H 'Accept: */*' \
  --data-raw '{"query":"query getUser{getUser{name age}}","variables":null}' \
  --compressed
```

上方请求化简

```shell
curl 'http://127.0.0.1:9080/graphql' \
  -H 'Content-Type: text/plain;charset=UTF-8' \
  -H 'Accept: */*' \
  --data-raw '
  {"query":"query getUser {
  				getUser {
  					name 
  					age
  				}
  			}",
  			"variables":null
  }' \
  --compressed
```

#### Actual result

HTTP/1.1 404 Not Found
Date: Tue, 08 Feb 2022 07:39:16 GMT
Content-Type: text/plain; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive

{
"error_msg": "404 Route Not Found"
}

#### Error log

2022/02/08 07:39:16 [error] 45#45: *1085159 [lua] ctx.lua:80: get_parsed_graphql(): failed to parse graphql: Syntax error near line 1 body:

#### Expected result

success

### 可参考的 GraphQL 官方文档

https://graphql.org/learn/serving-over-http/#post-request

https://graphql.org/learn/serving-over-http/#post-request

## 评估工作情况

### 第一次评估

我认为我需要修改 [graphql-lua](https://github.com/bjornbytes/graphql-lua/blob/master/graphql/parse.lua#L317) 库中的 `parse.lua`

```
curl 'http://127.0.0.1:9080/graphql' \
  -H 'Content-Type: text/plain;charset=UTF-8' \
  -H 'Accept: */*' \
  -d '{"query":"query getUser{getUser{name age}}","variables":null}' \
  --compressed
```


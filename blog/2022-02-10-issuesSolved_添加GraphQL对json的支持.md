---
slug: 解决一个issue的过程
title: 解决一个issue的过程
authors: CheverJohn
tags: [ProblemSolved, GraphQL, issueSolved, APISIX]
---

# 解决一个 issues 的过程

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

#### issue 提出者认为

一个正常的 graphql 请求应该是这样的：

```shell
curl 'https://api.mocki.io/v2/c4d7a195/graphql' \
  -H 'authority: api.mocki.io' \
  -H 'accept: */*' \
  -H 'content-type: application/json' \
  -H 'origin: https://api.mocki.io' \
  --data-raw '{"operationName":"getUser","variables":{},"query":"query getUser {\n  user(id: \"4dc70521-22bb-4396-b37a-4a927c66d43b\") {\n    id\n    email\n    name\n  }\n}\n"}' \
  --compressed
```

会返回

```shell
{
  "data": {
    "user": {
      "id": "Hello World",
      "email": "Hello World",
      "name": "Hello World"
    }
  }
}
```



#### 而且

A standard GraphQL POST request should use the application/json content type, and include a JSON-encoded body of the following form:

```
{
  "query": "...",
  "operationName": "...",
  "variables": { "myVariable": "someValue", ... }
}
```

see official graphql document, https://graphql.org/learn/serving-over-http/#post-request

and `--data` will perform request with `POST` method ,see `curl` document

A standard GraphQL POST request should use the application/json content type, and include a JSON-encoded body of the following form:

```
{
  "query": "...",
  "operationName": "...",
  "variables": { "myVariable": "someValue", ... }
}
```

see official graphql document, https://graphql.org/learn/serving-over-http/#post-request

and `--data` will perform request with `POST` method ,see `curl` document

#### 对于 curl 工具的使用

```
$ curl --help
Usage: curl [options...] <url>
 -d, --data <data>   **HTTP POST data**
...
```

use `-v` to print verbose log

```
curl -v 'https://api.mocki.io/v2/c4d7a195/graphql' \
  -H 'authority: api.mocki.io' \
  -H 'accept: */*' \
  -H 'content-type: application/json' \
  -H 'origin: https://api.mocki.io' \
  --data-raw '{"operationName":"getUser","variables":{},"query":"query getUser {\n  user(id: \"4dc70521-22bb-4396-b37a-4a927c66d43b\") {\n    id\n    email\n    name\n  }\n}\n"}' \
  --compressed
```

> issue 提出者原话：
>
> it will print something like this `> POST /v2/c4d7a195/graphql HTTP/2`, thought i'm not use `-X POST`
>
> sorry, I'm try to discuss about how APISIX deal with graphql request. it seems that the mock GraphQL data of APISIX is not a standard GraphQL request.

#### 得出结论: mock GraphQL data of APISIX is not a standard GraphQL request.

### 评估需求

看过这个 issue 之后，思考了 APISIX 中的 GraphQL 到底是什么。或许 APISIX 支持的是假的 GraphQL？思考明白之后才能动手做。

> 之前应该是只做了这个：If the "application/graphql" Content-Type header is present, treat the HTTP POST body contents as the GraphQL query string.

```shell
curl -v -H "Content-Type: application/graphql" -d "{ hello }"  "localhost:3000/graphql" 
```

需要指定 content-type 了



所以我对于这个 issue 的结论就是：需要 fix 三部分

1. 解决 POST JSON的问题，让 APISIX 支持 JSON 格式的 POST；
2. 支持 GET 。

但对于目前的 GraphQL 在 APISIX 中的应用来讲，是可以通过 `"application/graphql" Content-Type` 的形式绕过的。参考[文档](https://graphql.org/learn/serving-over-http/#post-request)中的这句：

> If the "application/graphql" Content-Type header is present, treat the HTTP POST body contents as the GraphQL query string.



#### 重点：点睛之笔

https://graphql.org/learn/serving-over-http/
参考官方的文档，实际上 APISIX 现在处理的场景是 

> If the "application/graphql" Content-Type header is present, treat the HTTP POST body contents as the GraphQL query string.

APISIX 暂时只能够实现 GraphQL query 的功能。

我们需要 `json` 格式的功能
最好还要加上 “GET” 的功能。



## 可参考的 GraphQL 官方文档

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


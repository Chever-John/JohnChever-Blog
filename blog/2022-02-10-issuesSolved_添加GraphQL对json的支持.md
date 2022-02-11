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

其实根据[这篇文档](https://graphql.org/learn/serving-over-http/#:~:text=A%20standard%20GraphQL%20POST%20request%20should%20use%20the%20application/json%20content%20type)。

一个标准的 GraphQL POST 请求就应该使用 `application/json` content type, 然后包括 json 格式的body在里边。

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

## 源码分析

找到 GraphQL 在 APISIX 中的代码，主要有关系的只有`apisix/core/ctx.lua` 中有相关代码。其实 APISIX 依靠的

```lua
--
-- Licensed to the Apache Software Foundation (ASF) under one or more
-- contributor license agreements.  See the NOTICE file distributed with
-- this work for additional information regarding copyright ownership.
-- The ASF licenses this file to You under the Apache License, Version 2.0
-- (the "License"); you may not use this file except in compliance with
-- the License.  You may obtain a copy of the License at
--
--     http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.
--
local core_str     = require("apisix.core.string")
local core_tab     = require("apisix.core.table")
local request      = require("apisix.core.request")
local log          = require("apisix.core.log")
local config_local = require("apisix.core.config_local")
local tablepool    = require("tablepool")
local get_var      = require("resty.ngxvar").fetch
local get_request  = require("resty.ngxvar").request
local ck           = require "resty.cookie"
local gq_parse     = require("graphql").parse
local setmetatable = setmetatable
local sub_str      = string.sub
local ngx          = ngx
local ngx_var      = ngx.var
local re_gsub      = ngx.re.gsub
local ipairs       = ipairs
local type         = type
local error        = error
local pcall        = pcall


local _M = {version = 0.2}
local GRAPHQL_DEFAULT_MAX_SIZE = 1048576               -- 1MiB


local function parse_graphql(ctx)
    local local_conf, err = config_local.local_conf()
    if not local_conf then
        return nil, "failed to get local conf: " .. err
    end

    local max_size = GRAPHQL_DEFAULT_MAX_SIZE
    local size = core_tab.try_read_attr(local_conf, "graphql", "max_size")
    if size then
        max_size = size
    end

    local body, err = request.get_body(max_size, ctx)
    if not body then
        return nil, "failed to read graphql body: " .. err
    end

    local ok, res = pcall(gq_parse, body)
    if not ok then
        return nil, "failed to parse graphql: " .. res .. " body: " .. body
    end

    if #res.definitions == 0 then
        return nil, "empty graphql: " .. body
    end

    return res
end


local function get_parsed_graphql()
    local ctx = ngx.ctx.api_ctx
    if ctx._graphql then
        return ctx._graphql
    end

    local res, err = parse_graphql(ctx)
    if not res then
        log.error(err)
        ctx._graphql = {}
        return ctx._graphql
    end

    if #res.definitions > 1 then
        log.warn("Multiple operations are not supported.",
                    "Only the first one is handled")
    end

    local def = res.definitions[1]
    local fields = def.selectionSet.selections
    local root_fields = core_tab.new(#fields, 0)
    for i, f in ipairs(fields) do
        root_fields[i] = f.name.value
    end

    local name = ""
    if def.name and def.name.value then
        name = def.name.value
    end

    ctx._graphql = {
        name = name,
        operation = def.operation,
        root_fields = root_fields,
    }

    return ctx._graphql
end


do
    -- 获取特殊var的方法
    local var_methods = {
        method = ngx.req.get_method,
        -- ref: https://github.com/cloudflare/lua-resty-cookie
        cookie = function ()
            if ngx.var.http_cookie then
                return ck:new()
            end
        end
    }

    local no_cacheable_var_names = {
        -- var.args should not be cached as it can be changed via set_uri_args
        args = true,
        is_args = true,
    }

    local ngx_var_names = {
        upstream_scheme            = true,
        upstream_host              = true,
        upstream_upgrade           = true,
        upstream_connection        = true,
        upstream_uri               = true,

        upstream_mirror_host       = true,

        upstream_cache_zone        = true,
        upstream_cache_zone_info   = true,
        upstream_no_cache          = true,
        upstream_cache_key         = true,
        upstream_cache_bypass      = true,

        var_x_forwarded_proto = true,
    }

    local mt = {
        -- 重载 hash 元方法
        -- t 是 self
        __index = function(t, key)
            
            -- 若 cache table 存在直接返回
            local cached = t._cache[key]
            if cached ~= nil then
                return cached
            end

            if type(key) ~= "string" then
                error("invalid argument, expect string value", 2)
            end

            local val
            -- 如果是特殊类型, 使用特定方法获取
            local method = var_methods[key]
            if method then
                val = method()

            elseif core_str.has_prefix(key, "cookie_") then
                -- 通过 var_methods 访问到 resty.cookie
                local cookie = t.cookie
                if cookie then
                    local err
                    val, err = cookie:get(sub_str(key, 8))
                    if err then
                        log.warn("failed to fetch cookie value by key: ",
                                 key, " error: ", err)
                    end
                end

            elseif core_str.has_prefix(key, "arg_") then
                local arg_key = sub_str(key, 5)
                local args = request.get_uri_args()[arg_key]
                if args then
                    if type(args) == "table" then
                        val = args[1]
                    else
                        val = args
                    end
                end

            elseif core_str.has_prefix(key, "http_") then
                key = key:lower()
                key = re_gsub(key, "-", "_", "jo")
                -- 最终通过 ngx.var 获取
                val = get_var(key, t._request)

            elseif core_str.has_prefix(key, "graphql_") then
                -- trim the "graphql_" prefix
                key = sub_str(key, 9)
                val = get_parsed_graphql()[key]

            elseif key == "route_id" then
                val = ngx.ctx.api_ctx and ngx.ctx.api_ctx.route_id

            elseif key == "service_id" then
                val = ngx.ctx.api_ctx and ngx.ctx.api_ctx.service_id

            elseif key == "consumer_name" then
                val = ngx.ctx.api_ctx and ngx.ctx.api_ctx.consumer_name

            elseif key == "route_name" then
                val = ngx.ctx.api_ctx and ngx.ctx.api_ctx.route_name

            elseif key == "service_name" then
                val = ngx.ctx.api_ctx and ngx.ctx.api_ctx.service_name

            elseif key == "balancer_ip" then
                val = ngx.ctx.api_ctx and ngx.ctx.api_ctx.balancer_ip

            elseif key == "balancer_port" then
                val = ngx.ctx.api_ctx and ngx.ctx.api_ctx.balancer_port

            else
                val = get_var(key, t._request)
            end

            if val ~= nil and not no_cacheable_var_names[key] then
                t._cache[key] = val
            end

            return val
        end,

        __newindex = function(t, key, val)
            if ngx_var_names[key] then
                ngx_var[key] = val
            end

            -- log.info("key: ", key, " new val: ", val)
            t._cache[key] = val
        end,
    }

function _M.set_vars_meta(ctx)
    local var = tablepool.fetch("ctx_var", 0, 32)
    if not var._cache then
        var._cache = {}
    end

    var._request = get_request()
    setmetatable(var, mt)
    ctx.var = var
end

function _M.release_vars(ctx)
    if ctx.var == nil then
        return
    end

    core_tab.clear(ctx.var._cache)
    tablepool.release("ctx_var", ctx.var, true)
    ctx.var = nil
end

end -- do


return _M
```

简单理一下函数框架

- parse_graphql(ctx)
- get_parsed_graphql()
- do
  - var_methods
  - no_cacheable_var_names
  - ngx_var_names
  - mt
    -  __index = function(t, key)
    -  __newindex = function(t, key, val)
- _M.set_vars_meta
- _M.release_vars

然后中有一部分代码可以从 APISIX 的官方一个源码文档里得到学习。

地址为：[请求生命周期](https://cloudnative.to/blog/apisix-source-code-reading/#:~:text=Use%20ngx.ctx%20wherever%20you%20can.%20ngx.var%20is)。

## 2022年2月11日的工作

1. 找到需要更改的代码范围，将 [graphql-lua](https://github.com/bjornbytes/graphql-lua/tree/master/graphql) 中的 `parse.lua` 代码理解清楚。
2. 将 `ctx.lua` 代码理解清楚。
3. 确定思路

## 开始工作

### 我的第一版计划

1. 向上游提交 json 格式的 PR
   1. 上游 PR 通过后，再进行 APISIX 的 issue 修复。
2. APISIX 中只要对上游的函数进行使用，并输出报错结果就行。



### 大佬思路

来自APISIX PMC [zexuan](https://github.com/spacewander)

大概意思就是，把 json 在APISIX 里解码成 query 字段，然后再将其query 喂给 graphql-lua。

我们并不需要支持 operationName、variable这些功能。

这个思路贼简单，那我为啥想不到呢？

轻微反思，是因为有点“眼高手低”处理实际问题的能力待加强。慢慢学习吧
---
slug: Support GraphQL In APISIX
title: Support GraphQL In APISIX
authors: CheverJohn
tags: [APISIX, GraphQL,科普向文章]
---
## **背景**

GraphQL 是一个开源的、面向API而创造出来的数据查询操作语言以及相应的运行环境。最初由Facebook 于 2012 年内部开发，2015年公开发布。2018年11月7日，Facebook 将 GraphQL 项目转移到新成立的 GraphQL 基金会。

你其实可以把它类比为 SQL 查询语句来理解。GraphQL 对 API 中的数据提供了一套易于理解的完整描述。客户端能够通过自定义的描述来准确获得其所需要的数据。同时这也让 API 能够从容面对日益复杂的接口发展，并避免最终成为一个令人望而生畏的复杂接口。

[Apache APISIX](https://apisix.apache.org/) 是 Apache 软件基金会的顶级开源项目，也是当前最活跃的开源网关项目。作为一个动态、实时、高性能的开源 API 网关，Apache APISIX 提供了负载均衡、动态上游、灰度发布、服务熔断、身份认证、可观测性等丰富的流量管理功能。

当然 Apache APISIX 同时也具备识别 GraphQL 语法的匹配能力，通过对请求中携带的 GraphQL 语句进行高效匹配，筛除异常流量，进一步保证安全性和提高系统性能。

## **APISIX** **和** **GraphQL** **的联系**

从概念上来看，Apache APISIX 是一个API网关，GraphQL 是一种“SQL 语言”。两者所存在的领域相差实在够远，却又因为共存于如今这个大数据大流量年代，可以互相取长补短，恰好融合在一起，这实在是一件很有趣的事情。我们接下来就主要开始聊一下这两项技术的结合。

首先我们来设立一个实际应用场景——微服务架构，并在此场景下讨论这个话题。

#### 实际场景中遇到的问题

在项目开展到后期的时候，往往会出现业务复杂化、团队复杂化的情况，微服务架构在当下已经成为解决这类情况的常见解决方案。从整体上来看，微服务架构中暴露的 GraphQL 接口设计方案大体应该有两种：分散式接口设计和集中式接口设计。

分散式接口设计中，每一个微服务对外暴露不同的端点，分别对外界提供服务。在这种场景下，请求的路由是根据用户请求服务的不同而进行分发的，也就是我们会有以下 GraphQL API 服务：

```Plain%20Text
https://www.xxx.com/posts/api/graphql
https://www.xxx.com/users/api/graphql
https://www.xxx.com/register/api/graphql
```

这种设计很明显没有充分利用好 GraphQL 的优势，当客户端同时请求多个服务资源的时候，并不能一次 HTTP 请求满足全部要求。

![两种设计方案](/img/2022-01-20-Support_GraphQL_In_APISIX/1.jpg)

集中式接口设计中，所有的微服务对外共同暴露一个端点。这种路由方式就不能用传统的 NGINX 来做了，因为在 NGINX 看来整个请求其实只有一个 URL 以及一些参数，只有解析请求参数中的查询信息才能够知道客户端到底访问了哪些资源。

#### 提出解决方案

Apache APISIX 作为 GraphQL 对外的“门户”，GraphQL 作为 Apache APISIX 的一种路由匹配规则。即是 Apache APISIX 为 GraphQL 提出的一种解决方案。

![提出解决方案](/img/2022-01-20-Support_GraphQL_In_APISIX/2.jpg)

在这一方案中，Apache APISIX 作为 API 网关“挡”在 GraphQL Server 之前，为整个后端系统提供了安全性的保障。并且 Apache APISIX 根据自身所具备的 GraphQL 匹配功能，先行筛选一部分请求，使整个请求资源过程变得更高效。

此外，Apache APISIX 还可以针对不同的 graphql_operation 进行不同的权限校验、针对不同的graphql_name 转发到不同的upstream。

总的来说，Apache APISIX 搭配 GraphQL 的方案，充分利用 GraphQL 搜索优势的同时也能拥有Apache APISIX 作为网关所具备的安全稳定性，是一件两全其美的事情。

#### 小结

GraphQL 本身是具有划时代意义的一项技术，但面对当前复杂的网络开发环境，强强联手才能打造更高效有力的产品。我们应当利用好 GraphQL 和 Apache APISIX 两者的优势，去应对更具有挑战性的工作。

## **GraphQL** **在** **APISIX** **中的应用**

### 基本逻辑

![基本原理](/img/2022-01-20-Support_GraphQL_In_APISIX/3.jpg)

1. 终端向 APISIX 发起带有 GraphQL 语句的请求；
2. Apache APISIX 匹配路由提取预设 GraphQL 数据；
3. Apache APISIX 通过预设 GraphQL 数据对请求数据进行匹配；
4. 匹配成功，Apache APISIX 将继续转发请求，请求交由后续 GraphQL Server 处理；
5. 匹配失败，Apache APISIX 将立刻终止请求。

Apache APISIX 通过 [graphql-lua](https://github.com/bjornbytes/graphql-lua) 库（对 GraphQL 官方解析的 lua 语言实现库）实现对 GraphQL 的支持。携带 GraphQL 语法的请求一开始先进入到 Apache APISIX，然后请求会先交由 GraphQL 解析库进行解析，将解析后的请求与 预设在 Apache APISIX 里的数据进行匹配。如果匹配成功 Apache APISIX 立刻放行并转发请求。

### **具体配置**

Apache APISIX 目前支持通过 GraphQL 的一些属性过滤路由，目前支持：

- graphql_operation

- graphql_name

- graphql_root_fields

例如，像这样的GraphQL语句：

```Nginx
query getRepo {
    owner {
        name
    }
    repo {
        created
    }
}
```

- `graphql_operation` 对应 `query`

- `graphql_name` 对应 `getRepo`，

- `graphql_root_fields` 对应 `["owner", "repo"]`

我们可以通过以下示例为 Apache APISIX 设置一条路由来验证对 GraphQL 的匹配能力：

```Shell
$ curl http://127.0.0.1:9080/apisix/admin/routes/1 -H 'X-API-KEY: edd1c9f034335f136f87ad84b625c8f1' -X PUT -i -d '
{
    "methods": ["POST"],
    "uri": "/_graphql",
    "vars": [
        ["graphql_operation", "==", "query"],
        ["graphql_name", "==", "getRepo"],
        ["graphql_root_fields", "has", "owner"]
    ],
    "upstream": {
        "type": "roundrobin",
        "nodes": {
            "192.168.1.200:4000": 1
        }
    }
}'
```

接下来使用带有 GraphQL 语句的请求去访问：

```Shell
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

如果匹配成功，则 Apache APISIX 继续进行请求转发。

```Apache
HTTP/1.1 200 OK
```

反之，便终止请求。

```Apache
HTTP/1.1 404 Not Found
```

## **场景举例**

在 Apache APISIX 插件生态圈里，有各式各样的插件可以选择，以应对不同的场景。我们这边选取常用的限速插件来构建一个实际应用场景。

### **搭配限流限速插件，提高请求性能**

目前 Apache APISIX 搭配 GraphQL 的方案，能够使两者发挥自己的长处。如若搭配上限流限速插件将会实现对流量更强的筛选性。

在限流限速方面，Apache APISIX 能够实现动态、精细化的限流限速。可以根据用户设置的配置随时更新状态，不需要重启，体现动态化。此外 Apache APISIX 还可以通过调节变量，实现业务上精细化的限流限速需求。





## 针对重要问题的解答

### 尤雨溪

> 作者：尤雨溪
> 链接：https://www.zhihu.com/question/38596306/answer/79714979
> 来源：知乎
> 著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。
>
> 
>
> GraphQL 确实并没有『火起来』，我觉得是这么几个因素：
>
> \1. 要在前端爽爽地使用 GraphQL，必须要在服务端搭建符合 GraphQL spec 的接口，基本上是整个改写服务端暴露数据的方式。目前 FB 官方就只有一个 Node.js 的 reference implementation，其他语言都是社区爱好者自己搞的。另外，GraphQL 在前端如何与视图层、状态管理方案结合，目前也只有 React/Relay 这个一个官方方案。换句话说，如果你不是已经在用 Node + React 这个技术栈，引入 GraphQL 成本略高，风险也不小，这就很大程度上限制了受众。
>
> \2. GraphQL 的 field resolve 如果按照 naive 的方式来写，每一个 field 都对数据库直接跑一个 query，会产生大量冗余 query，虽然网络层面的请求数被优化了，但数据库查询可能会成为性能瓶颈，这里面有很大的优化空间，但并不是那么容易做。FB 本身没有这个问题，因为他们内部数据库这一层也是抽象掉的，写 GraphQL 接口的人不需要顾虑 query 优化的问题。
>
> \3. 这个事情到底由谁来做？GraphQL 的利好主要是在于前端的开发效率，但落地却需要服务端的全力配合。如果是小公司或者整个公司都是全栈，那可能可以做，但在很多前后端分工比较明确的团队里，要推动 GraphQL 还是会遇到各种协作上的阻力。这可能是没火起来的根本原因。


凑字数专用！
第二天继续凑字数嘿嘿嘿
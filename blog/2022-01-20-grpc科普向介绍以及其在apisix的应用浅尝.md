---
slug: grpc科普向介绍以及其在apisix的应用浅尝
title: grpc科普向介绍以及其在apisix的应用浅尝
authors: CheverJohn
tags: [APISIX, 科普向文章]
---
# grpc科普向介绍以及其在apisix的应用浅尝

## grpc科普向介绍

> This page introduces you to gRPC and protocol buffers. gRPC can use protocol buffers as both its Interface Definition Language (**IDL**) and as its underlying message interchange format.

### 什么是protocol buffer

Protocol  Buffers是一种独立于语言和平台，可扩展的序列化结构数据格式，主要用于数据存储和RPC数据交换格式。目前google提供了[多种语言的 API](https://github.com/protocolbuffers/protobuf#:~:text=Protobuf%20supports%20several%20different%20programming%20languages.)；包含一个Protocol Buffers编译器和一个Protocol Buffers使用的类库。

精简来说，PB就是一种与语言、平台无关，且扩展性好的用于通信协议、数据存储的结构化数据串行化方法（所以叫**协议**）；
一种来自谷歌的数据交换格式方法；
类似于JSON、XML



好吧，这边有一点还是要强调一下的，**Protocol Buffer**和**Protocol Buffers**是两个不一样的东西。
**Protocol Buffer**是Google提供的一种数据序列化协议
**Protocol Buffers**是一种轻便高效的结构化数据存储格式，可以用于结构化数据序列化，很适合做数据存储或RPC数据交换格式。它可以用于通讯协议、数据存储等领域的**语言无关**、**平台无关**、**可扩展**的序列化结构数据格式。

通过将结构化的数据进串行化（序列化），从而实现**数据存储/RPC数据交换**的功能。

> 序列化：将数据结构或对象转换成二进制串的过程
>
> 反序列化：将在序列化过程中所生成的二进制串转换成数据结构或者对象的过程

#### Protocol Buffer特点

![PB特点](/img/2022-01-20-grpc_and_apisix/feat_of_grpc_and_apisix.png)

注：图片地址转自[链接](https://juejin.cn/post/6844903605409955848)

github地址：https://github.com/protocolbuffers/protobuf



#### 应用场景

传输数据量大 & 网络环境不稳定 的**数据存储、RPC 数据交换** 的需求场景

> 如 即时IM （QQ、微信）的需求场景



#### 正式使用

##### 首先安装

![首次安装](/img/2022-01-20-grpc_and_apisix/first_install.png)

##### 构建Protocol Buffer消息对象模型

![image-20220120020747127](/img/2022-01-20-grpc_and_apisix/build_message_model_PB.png)



##### 具体应用到平台

![具体应用到平台一](/img/2022-01-20-grpc_and_apisix/apply_to_platform.png)
![具体应用到平台二](/img/2022-01-20-grpc_and_apisix/apply_to_platform2.png)


即，在 **传输数据量较大**的需求场景下，`Protocol Buffer`比`XML、Json` 更小、更快、使用 & 维护更简单！



这里有一篇关于基本内容的学习，很快就能上手。

https://juejin.cn/post/6844903605409955848

关于接客户咯的大部分内容需求都在这了
https://juejin.cn/post/7028576246501998605

#### 一些引申

比如我们可以通过socket+PB协议来解决即时通讯问题，采用socket服务，依赖google的oc PB协议包来实现，socket是基于TCP协议，由通信协议和编程API组成，原理上一次HTTP协议握手成功后，与服务器建立双向连接，数据就可以直接从TCP通道传输了。基于事件的方式，二级制传输，反编译成json或者xml。




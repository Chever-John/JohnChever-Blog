---
slug: 关于ubuntu安装部署APISIX以及测试的想法
title: 关于ubuntu安装部署APISIX以及测试的想法
authors: CheverJohn
tags: [APISIX, Ubuntu, Test, Thinking]
---


![](http://cdn.mr8god.cn/img/20220315022050.png)

按照正常的操作，我先 clone fork 下来的仓库，然后安装相关依赖，这个我还是根据了 APISIX 2.10 的[文档版本](https://apisix.apache.org/zh/docs/apisix/2.10/install-dependencies#:~:text=Version%3A%202.10-,%E5%AE%89%E8%A3%85%E4%BE%9D%E8%B5%96,-%E6%B3%A8%E6%84%8F) 
里讲一系列步骤做的。如图所示：

![ubuntu 安装依赖](http://cdn.mr8god.cn/img/20220315023016.png)

然后这个地方坑的就来了，在最新的github 脚本里边，是有下面的这行命令的，也就是文档内容跟最新脚本内容是不相符的。
这个需要我及时去进行修改。

```shell
sudo apt-get install -y git openresty curl openresty-openssl111-dev make gcc libpcre3 libpcre3-dev libldap2-dev unzip
```

事实上运行了上面的命令之后，就不会有什么找不到 ldap 之类的问题了，淦
---
slug: 关于ubuntu安装部署APISIX以及测试的想法
title: 关于ubuntu安装部署APISIX以及测试的想法
authors: CheverJohn
tags: [APISIX, Ubuntu, Test, Thinking]
---

首先上我最终跑通一个测试的例子：

![](http://cdn.mr8god.cn/img/20220315022050.png)

## Installation
按照正常的操作，我先 clone fork 下来的仓库，然后安装相关依赖，这个我还是根据了 APISIX 2.10 的[文档版本](https://apisix.apache.org/zh/docs/apisix/2.10/install-dependencies#:~:text=Version%3A%202.10-,%E5%AE%89%E8%A3%85%E4%BE%9D%E8%B5%96,-%E6%B3%A8%E6%84%8F) 
里讲一系列步骤做的。千万注意，这个方法已经老套了，你应该用下面介绍的最新脚本的方法，如图所示：

![ubuntu 安装依赖](http://cdn.mr8god.cn/img/20220315023016.png)

## Make deps
然后这个地方坑的就来了，在最新的github 脚本里边，是有下面的这行命令的，也就是文档内容跟最新脚本内容是不相符的。
这个需要我及时去进行修改。

```shell
sudo apt-get install -y git openresty curl openresty-openssl111-dev make gcc libpcre3 libpcre3-dev libldap2-dev unzip
```

事实上运行了上面的命令之后，就不会有什么找不到 ldap 之类的问题了，淦

然后我们解决了 `make deps` 的问题。接下来就直接是 `make install`，一切正常。

## 开始测试部分
首先根据官方的命令安装
![](http://cdn.mr8god.cn/img/20220315024128.png)

1. 第一是安装 `perl` 的包管理工具 `cpanminus`：
```shell
apt install cpanminus
```


2. 第二然后通过 `cpanm` 安装 test-nginx 的依赖。
```shell
sudo cpanm --notest Test::Nginx IPC::Run > build.log 2>&1 || (cat build.log && exit 1)
```

3. 首先将 APISIX 加入到框架中去
```shell
export PERL5LIB=.:$PERL5LIB:/home/api7/dev_cj/apisix
```

4. 然后配置OpenResty 中的 NGINX 的环境变量配置
```shell
export PATH=/usr/local/openresty/nginx/sbin:$PATH
```

如果你遇到这样的问题
![](http://cdn.mr8god.cn/img/20220315024526.png)

你就需要下载子模块：
```shell
git submodule update --init --recursive
```
请注意，当我仅运行
```shell
apisix start
```

and

```shell
nohup etcd &
```

之后，便能够成功运行，如图

![](http://cdn.mr8god.cn/img/20220315030850.png)

---
slug: 跑通测试框架且解决多进程问题
title: 跑通测试框架且解决多进程问题
authors: CheverJohn
tags: [ProblemSolved, APISIX, NGINX, Test, OpenResty, Perl]
---

# 记录一次找错

我的问题描述

1. 无法跑测试（APISIX 的）；
2. Nginx 会启动多个进程。

然后我复现的命令如下可见

```shell
export PERL5LIB=.:$PERL5LIB:/home/api7/dev_cj/apisix

export PATH=/usr/local/openresty/nginx/sbin:$PATH

prove ....../example.t
```

然后就出现一个问题端口占用

解决办法：当跑测试的时候，因为 APISIX 会启动upstream 端口，所以如果不关闭 `openresty` 的阿虎，就会遇到端口占用的问题。

然后我运行

```shell
netstat -nultp
```

复现了 多个 nginx 进程的问题，

运行

```shell
ps -ef | grep nginx
```

发现了多个进程，意识到我的 `openresty` 还开着。

关闭 `openresty` 

```shell
openresty -s stop
```

然后利用kill -9 杀掉了很多个进程。这边我采取了笨方法，一个进程一个进程杀掉了，可以不用 `-9` ，这边 **remark** 一下。

```shell
kill -9 76007
kill -9 76008
kill -9 76009
```

APISIX 重启了一切正常



总结

```shell
ps -ef | grep nginx
```

这个命令还是要记记牢。


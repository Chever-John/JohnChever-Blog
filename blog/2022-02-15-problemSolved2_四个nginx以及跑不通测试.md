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

## 2022年 3月 8日

细节问题：没想到已经跑通测试的我，还是在新的开发机上跑测试框架遇到了问题。本次主要问题在于
一个安装包问题，所以说环境是真的无语，还是得设置到代理啊。我设置了git 的代理解决了问题，
详情方法，请参考 [link](https://www.cheverjohn.xyz/blog/%E8%AE%A9%E4%BD%A0%E7%9A%84%E8%99%9A%E6%8B%9F%E6%9C%BA%E4%B9%9F%E8%83%BD%E6%8B%A5%E6%9C%89%E4%BB%A3%E7%90%86) ，我的主要疏忽在于，没注意端口，
因为之前实在 Windows 本上做开发的，用的是 v2ray，端口是 10808，没曾想就照着走错了，离谱啊。此处 mark 一下，需要注意。

然后还有一个点需要注意一下，`make deps` 和 `LUAROCKS_SERVER=https://luarocks.cn make deps` 可以混着用，over。

放上遇到问题的图：

![我又遇到问题啦呜呜呜](http://cdn.mr8god.cn/img/error4runtest.png)

放上解决问题之后的图片：

![解决问题就是爽啊！](http://cdn.mr8god.cn/img/solved4runtest.png)
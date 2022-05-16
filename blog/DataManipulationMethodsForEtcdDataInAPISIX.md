---
slug: DataManipulationMethodsForEtcdDataInAPISIX
title: Data manipulation methods for etcd data in apisix
authors: CheverJohn
tags: [APISIX, GraphQL, ProblemSolved]
---

>这次的排错过程，主要是由我的 mentor 主导的，这边也给出了我导师的 github 账号，有兴趣的可以去交流一下哦。

```shell
tail -f logs/error.log
```

首先
static/img/2022-02-08-记录一次排错/image-20220208223242984.png
![image-20220208231005934](/img/2022-02-08-记录一次排错/image-20220208231005934.png)

![image-20220208230949696](/img/2022-02-08-记录一次排错/image-20220208230949696.png)

![image-20220208230815850](/img/2022-02-08-记录一次排错/image-20220208230815850.png)



![image-20220208230709047](/img/2022-02-08-记录一次排错/image-20220208230709047.png)

1. 得到 etcd 中所有的路由信息

```bash
etcdctl get / --prefix --keys-only
```

2. tail 日志信息

```bash
tail -f logs/error.log
```

3. 删除 etcd 中所有的 APISIX 路由数据

```bash
etcdctl del /apisix/routes --prefix
```

4. 这边也记录一下 etcd 的官方关闭命令，其实也可以参考其他进程类关闭的方法：

```shell
kill `pgrep etcd`
```

来自于 etcd [官方链接](https://etcd.io/docs/v2.3/admin_guide/)

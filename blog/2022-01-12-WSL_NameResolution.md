# WSL error in name-resolution

> 本文由 [简悦 SimpRead](http://ksria.com/simpread/) 转码， 原文地址 [blog.csdn.net](https://blog.csdn.net/pineapple_C/article/details/118997224)

一开始我想直接改 / etc/resolv.conf 文件的，但是文件中指出此文件是由 WSL 自动生成的，需要修改 / etc/wsl.conf 文件

于是的按照它的要求修改了

```
$ sudo vim /etc/wsl.conf
[network]
generateResolvConf=false
```

然后再修改 / etc/resolv.conf 文件

```
$ sudo vim /etc/resolv.conf
nameserver 8.8.8.8
```

ping 了百度可以了，但在我新打开一个窗口时就不行了，文件又变成了原来的样子，到底怎么搞？我找到了 github 上一个大神的帮助

[https://github.com/microsoft/WSL/issues/5256#issuecomment-666545999](https://github.com/microsoft/WSL/issues/5256#issuecomment-666545999)

原来 WSL 的 / etc/resolv.conf 文件是 run/resolvconf/resolv.conf 文件的软链接

在编辑完 wsl.conf 文件后关闭终端，再次打开终端，确保 / run/resolvconf 目录已被删除，再删除 / etc/resolv.conf 文件重新创建并编译一个就好。
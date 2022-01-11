---
slug: Centos_7_Minimal_2009安装开机不联网问题
title: Centos_7_Minimal_2009安装开机不联网问题
authors: CheverJohn
tags: [Centos7, ProblemSolved]
---
# Centos-7-Minimal-2009安装开机不联网问题



> 本文由 [简悦 SimpRead](http://ksria.com/simpread/) 转码， 原文地址 [blog.csdn.net](https://blog.csdn.net/gengkui9897/article/details/108017531)

**现象说明**  
    在安装 CentOS 系统后，有可能出现无法联网的问题，虚拟机中的网络配置并没有问题，而系统却无法联网, 也 ping 不同。  


**原因描述**  
    CentOS 默认开机不启动网络，因此需要对网络进行配置，开启网络开机启动。

**解决方法**

1.  打开终端，使用`ip addr`命令查看一下网络信息  
    ![findMyNIC](/img/2022-01-11-Centos_7_Minimal_2009_no_Internet_problem_solved/findMyNIC.png)  
    图中圈出的是系统网络名称，我们稍后会用到它，有的系统是 ens33，有的是 eth0 等
2.  切换至 root 用户，输入命令`vi /etc/sysconfig/network-scripts/ifcfg-<系统网络名称>`，我的是 eth33，所以输入`vi /etc/sysconfig/network-scripts/ifcfg-ens33`命令  
    ![login](/img/2022-01-11-Centos_7_Minimal_2009_no_Internet_problem_solved/login.png)
3.  进入 vi 界面，可以看到，ONBOOT 的值是 no  
    ![changeConfig](/img/2022-01-11-Centos_7_Minimal_2009_no_Internet_problem_solved/changeConfig.png)
4.  将 ONBOOT 的值改为 yes（不会使用 vi 的可以百度一下，很容易上手的）  
    ![afterChange](/img/2022-01-11-Centos_7_Minimal_2009_no_Internet_problem_solved/afterChange.png)
5.  保存后退出，重启系统（可以`reboot`命令重启）。重启完成后，可以使用浏览器打开个网页看看，也可以使用`ping`命令测试网络连通性  
    ![testNetwork](/img/2022-01-11-Centos_7_Minimal_2009_no_Internet_problem_solved/testNetwork.png)
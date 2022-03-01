---
slug: 树莓派andUbuntu20.04.3_LTS
title: 树莓派andUbuntu20.04.3 LTS
authors: CheverJohn
tags: [ProblemSolved, Ubuntu, RaspberryPi]
---
# 树莓派&Ubuntu20.04.3(LTS)

> 初始配置篇
>
> 我想用ubuntu(based RaspberryPi 4)尝试做一段开发环境

## 安装

我选择树莓派官方的安装器

![树莓派安装界面安装ubuntu](/img/2022-01-23-Ubuntu_RaspberryPi/1.png)
<center>图1. 树莓派安装界面安装Ubuntu中</center>


## 配置

等这个界面安装成功，**先不要急插入树莓派！！！**我们先配置一些参数。打开`资源管理器`，找到启动盘`system-boot(F:)`

![Ubuntu启动盘的位置](/img/2022-01-23-Ubuntu_RaspberryPi/2.png)
<center>图2. 资源管理器里Ubuntu启动盘的位置</center>


然后打开`system-boot(F:)`，我们可以看到如下图所示的文件夹列表

![两个配置文件位置](/img/2022-01-23-Ubuntu_RaspberryPi/3.png)
<center>图3. 两个配置文件的具体位置</center>

我们需要注意的是`config.txt`和`network-config`这两个文件，第一个可以用来调整我树莓派连接7寸显示屏的分辨率参数。第二个文件用来配置树莓派ubuntu连WiFi的能力。

### 连接网络

树莓派上的Ubuntu该如何连接网络呢？其实官方网站[文档](https://ubuntu.com/tutorials/how-to-install-ubuntu-on-your-raspberry-pi#3-wifi-or-ethernet)都说的很清楚了

我们只需要将文件中一些注释解除就可以了。

![网络配置文件](/img/2022-01-23-Ubuntu_RaspberryPi/4.png)
<center>图4.上图是文件原先的样子</center>


下面开始正式配置，可以看到其中`TP-LINK_A826`即我要连接的`WiFi SSID`。`password`自然就是该wifi的密码啦。

![网络配置详情](/img/2022-01-23-Ubuntu_RaspberryPi/5.png)
<center>图5. 网络配置文件最初始的样子</center>


这边有一个小提示，当我们修改完配置文件后，启动树莓派还是会遇到无法正常联网的情况，那这个时候只需要重启即可，这一块应该是有某些配置文件没有启动，期待有时间的时候，我可以去研究研究看看。

### 七寸屏幕分辨率

既然已经配置好了配置文件，那我们接下来得把树莓派连接七寸显示器分辨率异常的问题解决一下咯。

首先打开`config.txt`文件，然后按照下图在文件末尾添加

```shell
disable_overscan=1
hdmi_force_hotplug=1  # 强制树莓派使用HDMI端口，即使树莓派没有检测到显示器连接仍然使用HDMI端口。
#该值为0时允许树莓派尝试检测显示器，当该值为1时，强制树莓派使用HDMI。
hdmi_drive=2  # 可以使用该配置项来改变HDMI端口的电压输出：
# 1-DVI输出电压。该模式下，HDMI输出中不包含音频信号。
# 2-HDMI输出电压。该模式下，HDMI输出中包含音频信号。
hdmi_group=2  # 决定的分辨率
# DMT分辨率是hdmi_group=2，计算机显示器使用的分辨率；hdmi_group=1是CEA分辨率 ，CEA规定的电视规格分辨率
hdmi_mode=4 
```

![6](/img/2022-01-23-Ubuntu_RaspberryPi/6.png)
<center>图6. 添加完配置信息之后的config.txt</center>


![7](/img/2022-01-23-Ubuntu_RaspberryPi/7.jpg)
<center>图7. 是我最终成功启动树莓派Ubuntu的样子</center>


## root用户

当我正常启动了树莓派Ubuntu之后，其实就会遇到两个问题

1. root账号和ubuntu账号密码不知道
2. 无法通过ssh工具远程登录root账户

当然第一个问题其实是ubuntu约定成俗的东西。ubuntu在没有设置root账户密码的前提下，每次登录系统密码都是随机生成的。而ubuntu账号的密码默认就是ubuntu，牢记！然后还会要求你创建ubuntu账号的新密码，这边我设计成了我家路由器管理员密码，over。

![8](/img/2022-01-23-Ubuntu_RaspberryPi/8.jpg)
<center>图8. 发现密码不对劲，怎么都无法正常登录</center>

那我们的root账号密码该怎么设立呢？
其实只需要我们使用ubuntu账号修改密码即可
```shell
sudo passwd root
```
然后输入你的新密码即可。

![9](/img/2022-01-23-Ubuntu_RaspberryPi/9.jpg)
<center>图9. 按照方法解决了问题</center>

## 登录之后配置镜像源

这边需要注意的是，我们是arm架构的ubuntu系统，要在清华源上选择arm架构的镜像源，切记。

![10清华镜像源](/img/2022-01-23-Ubuntu_RaspberryPi/10.png)
<center>图10. 根据清华源官网上arm版本配置镜像源</center>

配置镜像源的详细过程就不用多说了，百度一下你就知道。
## 大功告成！

以上便是在树莓派（RaspberryPi4）中第一次安装ubuntu20.04.3版本的一系列操作。

其中遇到的很多问题在一开始是真的难受，就比如说网络配置，我有上官网看文档的习惯，可以第一次看到官网的配置我也愣是好一会儿没有解决（[官网文档在此](https://ubuntu.com/tutorials/how-to-install-ubuntu-on-your-raspberry-pi#:~:text=Getting%20setup%20with%20Wi%2DFi)）。最终呢，我是直接去看了ubuntu系统的启动盘的配置文件，在这个文件里才最终发现，其实我只要解除注释，就可以解决问题了。还有之前各种文章介绍的方法，是真的难以理解啊。比如这篇[文章](https://www.cnblogs.com/MikeZhang/p/raspi-ubuntu-set-wlan-20200529.html#:~:text=true%0A%20%20%20%20%20%20%20%20%20%20%20%20access%2Dpoints%3A-,%22wifi%E7%9A%84ssid%22%3A,-password%3A%20%22wifi%E5%AF%86%E7%A0%81)，我直接拉出来鞭尸，什么文章啊这，直接在关键地址配置了两个双引号，我咋知道具体是什么？？？写上一个真实案例又不会令别人蹭到你家WiFi，再说你可以改密码啊这。反正十分地令我生气。

> 气死我了气死我了，刚刚发现一篇很好的文章，居然在我写完之后，淦，非常地淦！
>
> 文章地址附下：https://mrxiuxing.com/posts/2f81a42d.html

然后也没遇到啥问题了。就这样，解散！

## 如果需要重新配置网络

当然你可以选择根据上面推荐的很不错的文档教程，一步一步去做。

ubuntu 的网络配置文件地址在 `/etc/netplan/` 中。

进入到配置目录中，你可以看到有一个叫做 `50-cloud-init.yaml` 的文件名：
```shell
root@ubuntu:/etc/netplan# ls -la
total 16
drwxr-xr-x  2 root root 4096 Mar  1 05:02 .
drwxr-xr-x 98 root root 4096 Feb 24 06:08 ..
-rw-r--r--  1 root root  822 Mar  1 05:02 50-cloud-init.yaml
```

查看其中，将网络根据自己的需求进行配置，你想 dhcp 还是 static 都可以。

最后使用下面命令让配置生效：
```shell
sudo netplan --debug apply
```
然后网络就配好了，over！

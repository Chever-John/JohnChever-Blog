---
 slug: OpenResty_Helloworld
title: OpenResty_Helloworld
authors: CheverJohn
tags: [网关, OpenResty, Debian, Lua, VSCode]
---
# OpenResty: Helloworld

### 博客内容简述

本篇博客主要是新手入门OpenResty的必经之路，也将是很多人第一次写lua脚本代码。内容包括如下：

1. 使用Debian-wsl安装OpenResty。
2. 在命令行运行输出“HelloWorld”。
3. 使用VSCode连接Debian-wsl，且运行Helloworld项目，且能够通过OpenResty部署在本地服务器上，然后通过curl命令获取“HelloWorld”。

### 本地环境

```Text
Windows10 Pro: 21H1(OS Build 19043.1415)
Debian: 11(bullseye) x86_64
OpenResty: 因为按照官方文档在Debian系统中添加了OpenResty仓库，这样以后可以随时安装或更新软件包（目前我的理解就是一行命令的事情）
```



## Debian-wsl上安装OpenResty

这个其实很是简单，在OpenResty的[官方文档](https://openresty.org/cn/linux-packages.html#debian)里就解释的很是详细，这边再简单过一下哈。

### 步骤一：安装导入GPG公钥时需要的几个依赖包

```bash
sudo apt-get -y install --no-install-recommends wget gnupg ca-certificates
```



### 步骤二：导入我们的GPG密钥

```bash
wget -O - https://openresty.org/package/pubkey.gpg | sudo apt-key add -
```



### 步骤三：添加OpenResty的官方apt仓库

对于 `x86_64` 或 `amd64` 系统，可以使用下面的命令：

```bash
codename=`grep -Po 'VERSION="[0-9]+ \(\K[^)]+' /etc/os-release`

echo "deb http://openresty.org/package/debian $codename openresty" \
    | sudo tee /etc/apt/sources.list.d/openresty.list
```

而对于 `arm64` 或 `aarch64` 系统，则可以使用下面的命令:

```bash
codename=`grep -Po 'VERSION="[0-9]+ \(\K[^)]+' /etc/os-release`

echo "deb http://openresty.org/package/arm64/debian $codename openresty" \
    | sudo tee /etc/apt/sources.list.d/openresty.list
```

这边我需要说一下哈，第一次看到这个其实很难理解。但是我们只需要照做就是了，也就是将这两行命令一次paste进命令行里即可。

我这边因为是上午就完成了，已经找不到了，就先不上图了哈。



### 步骤四：更新 APT 索引：

```bash
sudo apt-get update
```

然后就可以像下面这样安装软件包，比如 `openresty`：

```bash
sudo apt-get -y install openresty
```

这个包同时也推荐安装 `openresty-opm` 和 `openresty-restydoc` 包，所以后面两个包会缺省安装上。 如果你不想自动关联安装，可以用下面方法关闭自动关联安装：

```bash
sudo apt-get -y install --no-install-recommends openresty
```

PS：这里边就离谱，我都跑完命令了，然后告诉我可以关闭自动关联安装，淦。

## 命令行跑“Hello world”

第一次跑通的命令是这样的 hhhh

![命令行最简单Helloworld](http://cdn.mr8god.cn/img/image-20220110210916098.png)



对比一下Python的运行代码

![Python与OpenResty的比较](http://cdn.mr8god.cn/img/image-20220110211256448.png)



#### 一串代码稍稍揭露OpenResty本质

虽然好像还是阻止了进程，但是还是可以一瞥一二的。

![OpenResty的本质](http://cdn.mr8god.cn/img/image-20220110212231616.png)

## VSCode连接Debian-wsl

构建开发工作环境

其实只需要VSCode安装两个插件就行了

![VSCode安装两个插件](http://cdn.mr8god.cn/img/image-20220110212449822.png)

其中Lua插件甚至还可以给wsl上安装，MS是真的把这个wsl玩透了。

然后就可以继续在Debian-wsl上创建目录，目录如下：

![Debian-wsl上的目录](http://cdn.mr8god.cn/img/image-20220110212655342.png)

进而在```conf```文件夹创建```nginx.conf```

![nginx.conf in conf](http://cdn.mr8god.cn/img/image-20220110212740813.png)



然后这边一定要注意的是，将OpenResty加入到PATH环境中；
方法如下：

```shell
PATH=/usr/local/openresty/nginx/sbin:$PATH
export PATH
```

这样就可以如愿将OpenResty加入到PATH环境中；
然后启动OpenResty服务

```shell
openresty -p `pwd` -c conf/nginx.conf
```

![曲折的启动OpenResty服务](http://cdn.mr8god.cn/img/image-20220110213341006.png)

从这张图就可以很容易地看出来，我犯了至少两个错误

- 没有配置OpenResty的环境变量
- 代码写错了呢呜呜呜~

但是这串代码其实可以看出来，我们写的**第一个OpenResty程序**，在根目录下新增OpenResty的content_by_lua指令，里面又嵌入了```ngx.say```的代码：

然后这个时候我们的OpenResty的服务已经成功启动了，可以使用curl命令，查看结果的返回：

![result的返回](http://cdn.mr8god.cn/img/image-20220110213845023.png)

（当然前提是我使用```openresty -p `pwd` -c conf/nginx.conf```命令启动了OpenResty服务）

好嘞，第一个真正的OpenResty程序完成咯。
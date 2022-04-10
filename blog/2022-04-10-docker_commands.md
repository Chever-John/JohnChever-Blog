---
slug: Docker 命令的常备
title: Docker 命令常备
authors: CheverJohn
tags: [Docker, Command]
---


## 删除一些东西

### 自己常用的

我自己常用的 rm 命令（以前）

```shell
docker rm $(docker ps -a -q)
```

```shell
docker rmi $(docker ps -a)
```

```shell
docker rmi $(docker ps -a) -f
```

### 删除 exited 的容器

谨慎啊！有些容器我还是需要的哈！

```shell
docker rm $(docker ps -qf 'status=exited')
```

### 删除悬挂 images

```shell
docker rmi $(docker images -qf 'dangling=true')
```

### 删除悬挂 volume

```shell
docker volume rm $(docker volume ls -qf 'dangling=true')
```


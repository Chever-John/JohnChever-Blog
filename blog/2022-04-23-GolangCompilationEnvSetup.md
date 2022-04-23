---
slug: GolangCompilationEnvSetup
title: Golang compilation env setup
authors: CheverJohn
tags: [Golang]
---

# Golang compilation env setup

## GOROOT

The environment variable `GOROOT` indicates the Go language installation directory.

In `windows`, the default value of `GOROOT` is `C:/go`, while in macOS or Linux, the default value of `GOROOT` is `usr/local/go`. If you install Go in another directory, you need to change the value of `GOROOT` to the corresponding directory.

In addition, `GOROOT/bin` contains the toolchain that Go provides for us, so you should configure `GOROOT/bin` to the environment variable PATH so that we can use the Go toolchain globally.

### Linux setup GOROOT demo

```bash
export GOROOT=~/go
export PATH=$PATH:$GOROOT/bin
```

## GOPATH

> Note that the value of GOPATH cannot be the same as GOROOT

The environment variable `GOPATH` is used to specify our development workspace, which is where the source code, test files, library static files, and executable files are stored.

The default value of `GOPATH` in `Unix-like` (Mac OS or Linux) operating systems is `$home/go`. And the default value of `GOPATH` in Windows is `%USERPROFILE%\go` (for example, in Admin user, its value is `C:\Users\Admin\go`).

Of course, we can change the workspace by modifying `GOPATH`, for example, by setting the work `opt/go` in the following way.

### Linux setting GOPATH demo

```bash
export GOPATH=/opt/go
```

Also, you can set multiple workspaces in GOPATH, e.g.

```bash
export GOPATH=/opt/go;$home/go
```

##### subdirectory of GOPATH

The above code means that we specify two workspaces, but when we use the `go get` command to get the remote library, it will usually be installed in the first workspace.

According to the Go development specification, each work in the `GOPATH` directory is generally divided into three subdirectories: `src`, `pkg`, and `bin`, so we see each workspace like this.

So we see the workspace as follows.

```sh
bin/
    hello                          # command executable 可执行文件
    outyet                         # command executable 可执行文件
src/
    golang.org/x/example/
        .git/                      # Git repository metadata git仓库元数据
	hello/
	    hello.go               			 # command source 命令行代码
	outyet/
	    main.go                			 # command source 命令行代码
	    main_test.go           			 # test source		测试代码
	stringutil/
	    reverse.go             			 # package source 库文件
	    reverse_test.go        			 # test source		库文件
    golang.org/x/image/
        .git/                      # Git repository metadata git仓库元数据
	bmp/
	    reader.go              			 # package source 库文件
	    writer.go             			 # package source 库文件
    ... (many more repositories and packages omitted) ...
```

The `src` directory holds the source code files we developed, the corresponding directory below it is called **packages**, `pkg` holds the compiled library static files, and `bin` has the executable files in the backend of the source code compilation.

## GOBIN

The environment variable `GOBIN` indicates the directory where the compiled binary commands of our development program are installed.

When we use the `go install` command to compile and package the application, the command will package the compiled binary program GOBIN directory. Generally, we set GOBIN to `GOPATH/bin` directory.

### Linux GOBIN setup demo

```bash
export GOBIN=$GOPATH/bin
```

### Cross-Compilation
What is cross-compilation? By cross-compiling, we can generate code on one platform that can run on another platform. For example, we can generate binary programs that run on a 64-bit Linux OS on a 32-bit Windows OS development environment.

Cross-compiling in other programming languages may require third-party tools, but cross-compiling in Go is very simple, and the simplest thing to do is to set the two environment variables GOOS and GOARCH.

### GOOS and GOARCH

The default value of GOOS is our current operating system, and if windows, Linux, or mac os is operating, the value is darwin. GOARCH indicates the CPU architecture, such as 386, amd64, arm, etc.

### Get the GOOS and GOARCH values

We can use the `go env` command to get the current GOOS and GOARCH values.

```bash
go env GOOS GOARCH
```

### Range of GOOS and GOARCH values

GOOS and GOARCH values appear in pairs and can only be the values corresponding to the following list.

| $GOOS     | $GOARCH  |
| --------- | -------- |
| android   | arm      |
| darwin    | 386      |
| darwin    | amd64    |
| darwin    | arm      |
| darwin    | arm64    |
| dragonfly | amd64    |
| freebsd   | 386      |
| freebsd   | amd64    |
| freebsd   | arm      |
| linux     | 386      |
| linux     | amd64    |
| linux     | arm      |
| linux     | arm64    |
| linux     | ppc64    |
| linux     | ppc64le  |
| linux     | mips     |
| linux     | mipsle   |
| linux     | mips64   |
| linux     | mips64le |
| linux     | s390x    |
| netbsd    | 386      |
| netbsd    | amd64    |
| netbsd    | arm      |
| openbsd   | 386      |
| openbsd   | amd64    |
| openbsd   | arm      |
| plan9     | 386      |
| plan9     | amd64    |
| solaris   | amd64    |
| windows   | 386      |
| windows   | amd64    |

### Example

#### compiles a target program running on a 64-bit Linux operating system

```bash
GOOS=linux GOARCH=amd64 go build main.go
```

#### Compile target program on an arm architecture Android operation

```bash
GOOS=android GOARCH=arm GOARM=7 go build main.go
```

#### Environment variables list

Although we generally configure just a few environment variables, the Go language provides many environment variables that give us the freedom to customize development and compiler behavior.

Here is a list of all the environment variables provided by Go, which can generally be divided into the following categories, so it's good to know roughly because we can never use some environment variables.

#### via environment variables

```bash
GCCGO
GOARCH
GOBIN
GOCACHE
GOFLAGS
GOOS
GOPATH
GOPROXY
GORACE
GOROOT
GOTMPDIR
```

#### Environment variables to use with cgo

```bash
CC
CGO_ENABLED
CGO_CFLAGS
CGO_CFLAGS_ALLOW
CGO_CFLAGS_DISALLOW
CGO_CPPFLAGS, CGO_CPPFLAGS_ALLOW, CGO_CPPFLAGS_DISALLOW
CGO_CXXFLAGS, CGO_CXXFLAGS_ALLOW, CGO_CXXFLAGS_DISALLOW
CGO_FFLAGS, CGO_FFLAGS_ALLOW, CGO_FFLAGS_DISALLOW
CGO_LDFLAGS, CGO_LDFLAGS_ALLOW, CGO_LDFLAGS_DISALLOW
CXX
PKG_CONFIG
AR
```

#### Environment variables related to the system architecture system

```bash
GOARM
GO386
GOMIPS
GOMIPS64
```

#### Dedicated environment variables

```bash
GCCGOTOOLDIR
GOROOT_FINAL
GO_EXTLINK_ENABLED
GIT_ALLOW_PROTOCOL
```

#### Other environment variables

```bash
GOEXE
GOHOSTARCH
GOHOSTOS
GOMOD
GOTOOLDIR
```
---
slug: DemosAboutUAF
title: Thinking about UAF in Code
authors: CheverJohn
tags: [Safety, Thinking]
---

# UAF

This article greatly benefits from this article, and if you need to read the original article, please do not hesitate to click on this [link](https://www.zhihu.com/question/531243779/answer/2469998116).

This is my first write an article about safety while it does an essential position in our daily life.

UAF means "use after free". In binary security, there is a very much used vulnerability called **UAF** (use-after-free), which is a vulnerability caused by the continued use of a piece of memory after it has been freed.

Formal code:

```c
#include "stdio.h"
#include "stdlib.h"

void hack() {
  printf("hacked\n");
}

void hello() {
  printf("hello world\n");
}

typedef void (*fun_ptr)();

int main() {
  fun_ptr* phello = malloc(128);
  *phello = hello;
  (*phello)();
  free(phello);
  (*phello)();
}
```

Then you will see the error "segmentation fault".

![error of UFA](/img/2022-05-04-DemoAboutUAF/errorOfUFA.png)

**Explanation**: As you can see, we have defined two functions in C language, one output hello world, and one output hacked; we assume that in such a scenario, hello is executed in a higher authority, is the regular logic code, and the hack function is a malicious construction of a payload by other means, the implementation of the hostile program code   Q: The program only calls the hello program, how to add code to call the hack code without directly contacting the hack function?   
Answer:

1. We notice that at the end of the program, phello points to memory that has been freed but is called once again       
2. If we request a section of memory of the same size as before or a smaller one, it is likely to point to the same freed memory space       
3. If we write the address of the hack function to the new memory space, then the later call will call the hack function

add a line:

```c
#include "stdio.h"
#include "stdlib.h"

void hack() {
  printf("hacked\n");
}

void hello() {
  printf("hello world\n");
}

typedef void (*fun_ptr)();

int main() {
  fun_ptr* phello = malloc(128);
  *phello = hello;
  (*phello)();
  free(phello);
  *((fun_ptr*)malloc(128)) = hack;
  (*phello)();
}
```

Then you will see the terrible answer!

![UAFNow](/img/2022-05-04-DemoAboutUAF/UAFNow.png)

In writing some server-side programs or some programs with higher privileges such as drivers, if the program has also appeared to segment fault or access to an invalid memory address, please be vigilant.

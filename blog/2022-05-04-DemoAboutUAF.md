


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

---
slug: HashMap与HashTable的区别
title: HashMap与HashTable的区别
authors: CheverJohn
tags: [Java]
---
# HashMap与HashTable的区别

## 1.HashMap不是线程安全的。

HashMap是Map接口的子类，是将键映射到值的对象，其中键和值都是对象，并且不能包含重复键，但可以包含重复值。

HashMap允许nullkey和null value，而hashtable不允许。

 

## 2.HashTable是线程安全的

HashMap是Hashtable的轻量级实现（非线程安全的实现），他们都完成了Map接口，主要区别在于HashMap允许空键值，由于非线程安全，效率上可能高于Hashtable。

HashMap允许将null作为一个entry的key或者value，而Hashtable不允许。

HashMap把Hashtable的contains方法去掉了，改成containsvalue和containsKey。因为contains方法容易让人引起误解。

最大的不同是，Hashtable的方法是Synchronize的，而HashMap不是，在多个线程访问Hashtable时，不需要自己为它的方法实现同步，而HashMap就必须要为止提供外同步了。

Hashtable和HashMap采用的hash/rehash算法大致都一样，所以性能上不会有很大的差别。
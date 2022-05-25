---
slug: SomethingAboutFirstCreateRepo
title: Something About First Create Repo
authors: CheverJohn
tags: [Github, Thinking]
---

<!--truncate-->
**…or create a new repository on the command line**

```markdown
echo "# CJDormitory" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M master
git remote add origin git@github.com:Chever-John/CJDormitory.git
git push -u origin master
```

**…or push an existing repository from the command line**

```markdown
git remote add origin git@github.com:Chever-John/CJDormitory.git
git branch -M master
git push -u origin master
```

**…or import code from another repository**
You can initialize this repository with code from a Subversion, Mercurial, or TFS project.


# MDXecute

This software helps with preview in markdown, and it can compile and run a c++ project directly from the browser

It requires Node.js 20 or newer and `g++` on your PATH with c++20 support.

## Setup

```sh
npm ci
npm run build
node dist/cli.js examples/test.md
```


To install the local command:

```sh
npm link
mdxecute /path/to/notes.md
```

## Live preview

The browser checks for changes every 750 ms and updates automatically, keeping the current scroll position where possible. Enable autosave in your editor if you want updates while typing.

Updates will pause if there is a program running. After a Markdown change, previous program output is cleared. Invalid document metadata is shown above the previous preview; fixing and saving the file recovers automatically.

## C++ blocks

Use one entry point per document. A block named `main.cpp` automatically gets a Run Project button:

````md
```cpp {filename="main.cpp"}
#include <iostream>

int main() {
    std::cout << "Hello\n";
}
```
````

For a different entry filename, add `run`:

````md
```cpp {filename="example.cpp" run}
int main() {
    return 0;
}
```
````

Named C++ blocks in the same document form one project. `.cpp`, `.cc`, and `.cxx` source files are compiled together; headers can use names such as `include/math.h`. Use a C++ fence for headers too. Fences accept `cpp`, `c++`, `cc`, or `cxx`. Unnamed fences are displayed without compilation.

Run Project shows compilation success, exit code, duration, `stdout`, and `stderr`. Compilation is limited to 10 seconds and execution to 3 seconds. Output is limited to 1 MiB per stream. Interactive stdin is not supported; the program receives EOF.

Programs run locally with your account's permissions. Run code you trust.

## Note-taking Markdown

Standard headings, lists, links, images, blockquotes, tables, fenced code, and strikethrough are supported. Additional syntax:

| Feature | Syntax |
| --- | --- |
| Unchecked task | `- [ ] Read chapter` |
| Checked task | `- [x] Finish exercise` |
| Highlight | `==important==` |
| Subscript | `H~2~O` |
| Superscript | `x^2^` |
| Strikethrough | `~~old text~~` |
| Footnote reference | `Statement[^1]` |
| Footnote definition | `[^1]: Supporting detail` |

Definition lists:

```md
Term
: Definition
```

Checkboxes reflect the Markdown file and are read-only in the preview. Change `[ ]` to `[x]` in your editor and save.

Images may use URLs or relative paths within the Markdown file's directory, including subdirectories. Raw HTML is escaped. LaTeX math and Mermaid diagrams are not rendered by this version.

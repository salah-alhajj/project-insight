# Contributing to Project Insight

First off, thank you for considering contributing to Project Insight! 🎉 It's people like you that make Project Insight such a great tool for VSCode users.

## 📜 Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please take a moment to read it before proceeding.

## 🤝 How Can I Contribute?

### Reporting Bugs 🐛

This section guides you through submitting a bug report for Project Insight. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

- Use a clear and descriptive title for the issue to identify the problem.
- Describe the exact steps which reproduce the problem in as many details as possible.
- Provide specific examples to demonstrate the steps.
- Describe the behavior you observed after following the steps and point out what exactly is the problem with that behavior.
- Explain which behavior you expected to see instead and why.
- Include screenshots and animated GIFs which show you following the described steps and clearly demonstrate the problem.
- If you're reporting that Project Insight crashed, include a crash report with a stack trace from the operating system.

### Suggesting Enhancements 💡

This section guides you through submitting an enhancement suggestion for Project Insight, including completely new features and minor improvements to existing functionality.

- Use a clear and descriptive title for the issue to identify the suggestion.
- Provide a step-by-step description of the suggested enhancement in as many details as possible.
- Provide specific examples to demonstrate the steps or point out the part of Project Insight which the suggestion is related to.
- Describe the current behavior and explain which behavior you expected to see instead and why.
- Explain why this enhancement would be useful to most Project Insight users.
- List some other VSCode extensions or applications where this enhancement exists, if applicable.

### Your First Code Contribution 🚀

Unsure where to begin contributing to Project Insight? You can start by looking through these `beginner` and `help-wanted` issues:

- [Beginner issues](https://github.com/salah-alhajj/project-insight/labels/beginner) - issues which should only require a few lines of code, and a test or two.
- [Help wanted issues](https://github.com/salah-alhajj/project-insight/labels/help%20wanted) - issues which should be a bit more involved than `beginner` issues.

### Pull Requests 🔧

- Fill in the required template
- Do not include issue numbers in the PR title
- Include screenshots and animated GIFs in your pull request whenever possible.
- Follow the [TypeScript](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html) styleguide.
- Include thoughtfully-worded, well-structured [Jest](https://jestjs.io/) tests in the `./src/__tests__` folder. Run them using `npm test`.
- Document new code based on the [Documentation Styleguide](#documentation-styleguide)
- End all files with a newline

## Styleguides

### Git Commit Messages 📝

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Consider starting the commit message with an applicable emoji:
    - 🎨 `:art:` when improving the format/structure of the code
    - 🐎 `:racehorse:` when improving performance
    - 🚱 `:non-potable_water:` when plugging memory leaks
    - 📝 `:memo:` when writing docs
    - 🐛 `:bug:` when fixing a bug
    - 🔥 `:fire:` when removing code or files
    - 💚 `:green_heart:` when fixing the CI build
    - ✅ `:white_check_mark:` when adding tests
    - 🔒 `:lock:` when dealing with security
    - ⬆️ `:arrow_up:` when upgrading dependencies
    - ⬇️ `:arrow_down:` when downgrading dependencies
    - 👕 `:shirt:` when removing linter warnings

### TypeScript Styleguide 📐

All TypeScript code is linted with [ESLint](https://eslint.org/).

- Prefer the object spread operator (`{...anotherObj}`) to `Object.assign()`
- Inline `export`s with expressions whenever possible
  ```ts
  // Use this:
  export const someVar = 123;

  // Instead of:
  const someVar = 123;
  export { someVar };
  ```
- Place interfaces in separate files
- Use PascalCase for type names
- Do not use `I` as a prefix for interface names
- Use PascalCase for enum values
- Use camelCase for function names
- Use camelCase for property names and local variables
- Use whole words in names when possible

### Documentation Styleguide 📚

- Use [Markdown](https://daringfireball.net/projects/markdown) for documentation.
- Reference methods and classes in markdown with the custom `{}` notation:
    - Reference classes with `{ClassName}`
    - Reference instance methods with `{ClassName.methodName}`
    - Reference class methods with `{ClassName.methodName}`

## Additional Notes

### Issue and Pull Request Labels 🏷️

This section lists the labels we use to help us track and manage issues and pull requests.

* `bug` - Issues that are bugs.
* `enhancement` - Issues that are feature requests.
* `documentation` - Issues or pull requests related to documentation.
* `good first issue` - Good for newcomers.
* `help wanted` - Extra attention is needed.
* `question` - Further information is requested.


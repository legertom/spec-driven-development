# Course template

Copy this folder to `content/courses/<your-course-slug>/` and edit. Folders whose name starts with `_` are ignored by the platform, so this template never shows up in the catalog.

```
content/courses/<slug>/
  course.json        title, modules, lesson order, running example, tutor notes
  glossary.json      optional; terms shown on the course glossary page and linked from lessons
  lessons/<lesson-slug>.md
  quizzes/<lesson-slug>.json
  notes/<lesson-slug>.md   optional instructor notes
```

See `docs/ADDING_A_COURSE.md` for the full walkthrough and `docs/AUTHOR_BRIEF.md` for the lesson and quiz formats.

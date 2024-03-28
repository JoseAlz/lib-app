// Explination of express-validator syntax and structure
// https://express-validator.github.io/docs/guides/validation-chain
const Author = require('../models/author.js');
const Book = require('../models/book.js');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const debut = require("debug")("author");

// Display list of all Authors.
exports.author_list = asyncHandler(async (req, res, next) => {
  const allAuthors = await Author.find().sort({ family_name: 1}).exec();
  res.render("author_list", {
    title: "Author List",
    author_list: allAuthors,
  });
});

// Display detail page for a specific Author.
exports.author_detail = asyncHandler(async (req, res, next) => {
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (author == null) {
    // No results.
    const err = new Error("Author not found");
    err.status = 404;
    return next(err);
  }

  res.render('author_detail', {
    title: "Author Detail",
    author: author,
    author_books: allBooksByAuthor,
  });
});

// Display Author create form on GET.
exports.author_create_get = asyncHandler(async (req, res, next) => {
  res.render('author_create', { title: "Create Author" });
});

// Display Author create on POST.
exports.author_create_post = [
  // Validate & sanitize fields.
  body("first_name")        // For the "first_name" field in `req.body`
  .trim()                   // Trims whitespace
  .isLength({ min: 1})      // Validates length of input
  .escape()                 // Escapes then sends message below
  .withMessage("First name must be specified.")
  .isAlphanumeric()         // NOTE: Never validate names using .isAlphanumeric(). There are
  .escape()                 // NOTE: many anmes that use other character sets.
  .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
  .trim()
  .isLength({ min: 1})
  .escape()
  .withMessage("Family name must be specified.")
  .isAlphanumeric()
  .escape()
  .withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
  .optional({ values: "falsy" })
  .isISO8601()
  .toDate(),
  body("date_of_death", "Invalid date of death")
  .optional({ values: "falsy" })
  .isISO8601()
  .toDate(),

  // Process request after validation & sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create Author object with escaped and trimmed data
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });

    if (!errors.isEmpty()) {
      // Errors exist. Render form again with sanitized values/errors messages.
      res.render("author_create", {
        title: "Create Author",
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid
      // Save author
      await author.save();
      res.redirect(author.url);
    }
  }),
];

// Display Author delete form on GET.
exports.author_delete_get = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel).
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (author === null) {
    // No results.
    res.redirect("/catalog/authors");
  }

  res.render('author_delete', {
    title: "Delete Author",
    author: author,
    author_books: allBooksByAuthor,
  });
});

// Display Author delete on POST.
exports.author_delete_post = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel).
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (allBooksByAuthor > 0) {
    // Author has books
    res.render('author_delete', {
      title: "Delete Author",
      author: author,
      author_books: allBooksByAuthor,
    });
    return;
  } else {
    // Author has no books. Delete object and redirect to the list of authros.
    await Author.findByIdAndDelete(req.body.authorid);
    res.redirect('/catalog/authors');
  };
});

// Display Author update form on GET.
exports.author_update_get = asyncHandler(async (req, res, next) => {
  // Get author and all the books by the author.
  const author = await Author.findById(req.params.id).exec();

  // Implementing error tracking.
  if (author === null) {
    // No results
    debug(`id not found on update: ${req.params.id}`);
    const err = new Error("Author not found");
    err.status = 404;
    return next(err);
  }

  // Render page
  res.render('author_create', {
    title: "Update Author",
    author: author,
  });
});

// Display Author update on POST.
exports.author_update_post = [
  // Validate & sanitize fields.
  body("first_name")        // For the "first_name" field in `req.body`
  .trim()                   // Trims whitespace
  .isLength({ min: 1})      // Validates length of input
  .escape()                 // Escapes then sends message below
  .withMessage("First name must be specified.")
  .isAlphanumeric()         // NOTE: Never validate names using .isAlphanumeric(). There are
  .escape()                 // NOTE: many anmes that use other character sets.
  .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
  .trim()
  .isLength({ min: 1})
  .escape()
  .withMessage("Family name must be specified.")
  .isAlphanumeric()
  .escape()
  .withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
  .optional({ values: "falsy" })
  .isISO8601()
  .toDate(),
  body("date_of_death", "Invalid date of death")
  .optional({ values: "falsy" })
  .isISO8601()
  .toDate(),

  // Process request after validation & sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create Author object with escaped and trimmed data
    // Must include the id
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // Errors exist. Render form again with sanitized values/errors messages.
      res.render("author_create", {
        title: "Create Author",
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid, so save Author
      const updatedAuthor = await Author.findByIdAndUpdate(req.params.id, author, {});
      // redirect to updated book's detail page.
      res.redirect(updatedAuthor.url);
    }
  }),
];

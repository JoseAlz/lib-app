const BookInstance = require('../models/bookinstance.js');
const Book = require('../models/book.js');
const Author = require('../models/author.js');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');

// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allBookInstances = await BookInstance.find().populate("book").exec();

  res.render("bookinstance_list", {
    title: "Book Instance List",
    bookinstance_list: allBookInstances,
  });
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id).populate("book").exec();

  if (bookInstance === null) {
    // No results.
    const err = new Error("Book copy not found");
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_detail", {
    title: "Book:",
    bookinstance: bookInstance,
  });
});

// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();

  res.render("bookinstance_create",{
    title: "Create BookInstance",
    book_list: allBooks,
    selected_book: undefined,
  });
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate & sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified").trim().isLength({ min: 1 }).escape(),
  body("status").escape(),
  body("due_back", "Invalid date").optional({ values: "falsy" }).isISO8601().toDate(),

  // Process request after validation & sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped & trimmed data.
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // Errors exist.
      // Render form again with sanitized values and error messages.
      const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();
      res.render("bookinstance_create", {
        title: "Create BookInstance",
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        errors: errors.array(),
        bookinstance: bookInstance,
      });
      return;
    } else {
      // Data from form is valid
      await bookInstance.save();
      res.redirect(bookInstance.url);
    }
  }),
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  // I've separated the ORM calls because they're chained.
  // I don't believe I can get each data object in parallel from the same value.
  const bookInstance = await BookInstance.findById(req.params.id).exec();
  const book = await Book.findById(bookInstance.book).exec();
  const author = await Author.findById(book.author).exec();

  // Render the page with the pulled information.
  res.render('bookinstance_delete', {
    title: "Delete Book Instance",
    book: book,
    author: author,
    bookInstance: bookInstance,
  });
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  // Since a book instance has no dependencies,
  // we can immediately delete the book instance with prejudicel

  await BookInstance.findByIdAndDelete(req.params.id).exec();
  res.redirect('/catalog/bookinstances');
});

// Handle BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  // Call database from URL params
  const [bookInstance, allBooks] = await Promise.all([
    BookInstance.findById(req.params.id).exec(),
    Book.find({}, "title").sort({ title: 1 }).exec(),
  ]);

  // Render the page with the pulled information.
  res.render('bookinstance_create', {
    title: "Update Book Instance",
    book_list: allBooks,
    selected_book: bookInstance.book._id,
    bookinstance: bookInstance,
  })
});

// Handle BookInstance update on POST.
exports.bookinstance_update_post = [
  // Validate & sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified").trim().isLength({ min: 1 }).escape(),
  body("status").escape(),
  body("due_back", "Invalid date").optional({ values: "falsy" }).isISO8601().toDate(),

  // Process request after validation & sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped & trimmed data.
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // Errors exist.
      // Render form again with sanitized values and error messages.
      const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();
      res.render("bookinstance_create", {
        title: "Update Book Instance",
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        errors: errors.array(),
        bookinstance: bookInstance,
      });
      return;
    } else {
      // Data from form is valid
      const updatedBookInstance = await BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {});
      // redirect to updated book's detail page.
      res.redirect(updatedBookInstance.url);
    }
  }),
];

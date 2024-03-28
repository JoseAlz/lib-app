const Book = require('../models/book.js');
const Author = require('../models/author.js');
const Genre = require('../models/genre.js');
const BookInstance = require('../models/bookinstance.js');
const { body, validationResult } = require('express-validator');

const asyncHandler = require('express-async-handler');

// Book Catalog homepage
exports.index = asyncHandler(async (req, res, next) => {
  // Get details of books, book instances, authors, and genre counts (in parallel).
  const [
  numBooks,
  numBookInstances,
  numAvailableBookInstances,
  numAuthors,
  numGenres,
] = await Promise.all([
      Book.countDocuments({}).exec(),
      BookInstance.countDocuments({}).exec(),
      BookInstance.countDocuments({ status: "Available" }).exec(),
      Author.countDocuments({}).exec(),
      Genre.countDocuments({}).exec(),
    ]);

  res.render("catalog", {
    title: "Local Library Home",
    book_count: numBooks,
    book_instance_count: numBookInstances,
    book_instance_available_count: numAvailableBookInstances,
    author_count: numAuthors,
    genre_count: numGenres,
  });
});

// Display list of all Books.
exports.book_list = asyncHandler(async (req, res, next) => {
  // Display list of all books.
  const allBooks = await Book.find({}, "title author")
    .sort({ title: 1 })
    .populate("author")
    .exec();

  res.render("book_list", { title: "Book List", book_list: allBooks});
});

// Display detail page for a specific Book.
exports.book_detail = asyncHandler(async (req, res, next) => {
  const [book, bookInstances] = await Promise.all([
    Book.findById(req.params.id).populate("author").populate("genre").exec(),
    BookInstance.find({ book: req.params.id }).exec(),
  ]);
  if (book === null) {
    // No results
    const err = new Error("Book not found");
    err.status = 400;
    return next(err);
  }
  res.render("book_detail", {
    title: book.title,
    book: book,
    book_instances: bookInstances,
  });
});

// Display Book create form on GET.
exports.book_create_get = asyncHandler(async (req, res, next) => {
  // Get all authors and genres, which we can use for adding to our book.
  const [allAuthors, allGenres] = await Promise.all([
    Author.find().sort({ family_name: 1 }).exec(),
    Genre.find().sort({ name: 1 }).exec()
  ]);

  res.render('book_create', {
    title: "Create Book",
    authors: allAuthors,
    genres: allGenres,
    book: undefined,
  });
});

// Handle Book create on POST.
exports.book_create_post = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre = typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },

  // Validate & sanitize fields.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("genre.*").escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract validation errors from a request.
    const errors = validationResult(req);

    // Create a book object with escaped and trimmed data.
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });

    if (!errors.isEmpty()) {
    // Errors exist. Render form again with sanitized values/error messages.
    // Get all authors & genres for form.
      const [allAuthors, allGenres] = await Promise.all([
        Author.find().sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec()
      ]);

    // Mark our selected genres as checked.
    // Looks like were checking genres only for an erroneous POST request,
    // to maintain state between views. The following step does nothing for
    // posting to the database.
      for (const genre of allGenres) {
        if (book.genre.includes(genre._id)) {
          genre.checked = "true";
        }
      };
      res.render("book_create", {
        title: "Create Book",
        authors: allAuthors,
        genres: allGenres,
        book: book,
        errors: errors.array(),
      });
    } else {
    // Data from form is valid
      await book.save();
      res.redirect(book.url);
    }
  }),
];

// Display Book delete form on GET.
exports.book_delete_get = asyncHandler(async (req, res, next) => {
  // Get book info an all instances of the book.
  const [book, allBookInstances] = await Promise.all([
    Book.findById(req.params.id).populate("author").exec(),
    BookInstance.find({ book: req.params.id }).exec(),
  ]);

  // Send the book & book instance information.
  res.render("book_delete", {
    title: "Delete Book",
    book: book,
    book_instances: allBookInstances,
  });
});

// Handle Book delete on POST.
exports.book_delete_post = asyncHandler(async (req, res, next) => {
  // Get book info an all instances of the book.
  const [book, allBookInstances] = await Promise.all([
    Book.findById(req.params.id).populate("author").exec(),
    BookInstance.find({ book: req.params.id }).exec(),
  ]);

  // Verify there are no book instances.
  if (allBookInstances > 0) {
    res.render('book_delete', {
      title: "Delete Book",
      book: book,
      book_instances: allBookInstances,
    });
    return;
  } else {
    // Everything good, let's delete the book.
    await Book.findByIdAndDelete(req.params.id).exec();
    res.redirect('/catalog/books');
  }
});

// Handle Book update form on GET.
exports.book_update_get = asyncHandler(async (req, res, next) => {
  const [book, allAuthors, allGenres] = await Promise.all([
    Book.findById(req.params.id).populate("author").exec(),
    Author.find().sort({ family_name: 1 }).exec(),
    Genre.find().sort({ name: 1 }).exec()
  ]);

  if (book === null) {
    // No results.
    const err = new Error("Book not found");
    err.status = 404;
    return next(err);
  }

  // Mark our selected genres as checked.
  allGenres.forEach((genre) => {
    if (book.genre.includes(genre._id)) {genre.checked = 'true'};
  });

  res.render('book_create', {
    title: "Update Book",
    authors: allAuthors,
    genres: allGenres,
    book: book,
  });
});

// Handle Book update on POST.
exports.book_update_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre = typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },

  // Validate and sanitize fields.
  body("title", "Title must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("author", "Author must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("summary", "Summary must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("isbn", "ISBN must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  // Process request after validation & sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation erros from a request.
    const errors = validationResult(req);

    // Create a Book object with escaped/trimmed data and old id.
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
      _id: req.params.id, // This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      // Errors exist. Render form again with sanitized values/error messages.

      // Get all authors and genres for form
      const [allAuthor, allGenres] = await Promise.all([
        Author.find().sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec(),
      ]);

      // Mark our selected genres are checked.
      for (const genre of allGenres) {
        if (book.genre.indexOf(genre._id) > -1) {
          genre.checked = "true";
        }
      }
      // Render the page
      res.render("book_create", {
        title: "Update Book",
        authors: allAuthors,
        genres: allGenres,
        book: book,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      const updatedBook = await Book.findByIdAndUpdate(req.params.id, book, {});
      // redirect to updated book's detail page.
      res.redirect(updatedBook.url);
    }
  }),
];


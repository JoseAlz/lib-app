const Genre = require('../models/genre.js');
const Book = require('../models/book.js');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');

// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
  const allGenres = await Genre.find().sort({ name: 1 }).exec();
  res.render('genres', {
    title: 'Genres',
    genres: allGenres,
  });
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
  // res.send(`NOT IMPLEMENTED: Genre detail: ${req.params.id}`);
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);
  if (genre === null) {
    // No results.
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }
  res.render("genre_detail", {
    title: "Genre Detail",
    genre: genre,
    genre_books: booksInGenre,
  });
});

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
  res.render('genre_create', { title:"Create Genre" });
};

// Display Genre create on POST.
exports.genre_create_post = [
  // Validate & sanitize the name field.
  body("name", "Genre name must contain at least 3 characters")
  .trim()
  .isLength({ min: 3 })
  .escape(),

  // Process request after validation and sanitation.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from request.
    const errors = validationResult(req);

    // Create a genre object with esscaped and trimmed data.
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // Errors exist. Render the form again with sanitized values/error messages.
      res.render('genre_create', {
        title: "Create Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from is valid.
      // Check if Genre with same name already exists.
      const genreExists = await Genre.findOne({ name: req.body.name }).exec();
      if (genreExists) {
        // Genre exists, redirect to its detail page.
        res.redirect(genreExists.url);
      } else {
        await genre.save();
        // New genre saved. Redirect to newly create genre page.
        res.redirect(genre.url);
      }
    }
  }),
];

// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  // Get database objects from parameters and MongoDB.
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);

  // Send data to specified webpage.
  res.render('genre_delete', {
    title: "Delete Genre",
    genre: genre,
    books: booksInGenre,
  });
});

// Display Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  // Get genre and all books in genre.
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);

  // Verify that there are, in fact, no books using this genre.
  if (booksInGenre > 0) {
    // Genre still has books.
    res.render('genre_delete', {
      title: "Delete Genre",
      genre: genre,
      book: booksInGenre,
    });
  } else {
    // Genre does not have books.
    await Genre.findByIdAndDelete(req.params.id).exec();
    res.redirect('/catalog/genres');
  }
});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
  const genre = await Genre.findById(req.params.id);
  res.render("genre_create", {
    title: "Update Genre",
    genre: genre,
  });
});

// Display Genre update on POST.
exports.genre_update_post = [
  // Validate & sanitize the name field.
  body("name", "Genre name must contain at least 3 characters")
  .trim()
  .isLength({ min: 3 })
  .escape(),

  // Process request after validation and sanitation.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from request.
    const errors = validationResult(req);

    // Create a genre object with esscaped and trimmed data.
    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // Errors exist. Render the form again with sanitized values/error messages.
      res.render('genre_create', {
        title: "Create Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from is valid.
      // Check if Genre with same name already exists.
      const genreExists = await Genre.findOne({ name: req.body.name }).exec();
      if (genreExists) {
        // Genre exists, redirect to its detail page.
        res.redirect(genreExists.url);
      } else {
        // No errors, send updated genre to MongoDB.
        const updatedGenre = await Genre.findByIdAndUpdate(req.params.id, genre, {});
        // Redirect to newly updated genre detail page.
        res.redirect(updatedGenre.url);
      }
    }
  }),
]

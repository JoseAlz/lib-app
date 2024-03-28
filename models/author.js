const mongoose = require("mongoose");
const { DateTime } = require("luxon");

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
  first_name: { type: String, required: true, maxLength: 100 },
  family_name: { type: String, required: true, maxLength: 100 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date },
});

// Virtual for Author's full name
AuthorSchema.virtual("name").get(function() {
  // To avoid errors in cases where an author does not have either a family name or a first name
  // We want to make sure we handle the exception by returning an empty string for that case
  let fullname = "";
  if (this.first_name && this.family_name) {
    fullname = `${this.family_name}, ${this.first_name}`;
  }
  return fullname;
});

// Virtual for Author's URL
AuthorSchema.virtual("url").get(function() {
  // We don't use an arrow function as we'll need the 'this' object
  return `/catalog/author/${this._id}`;
});

// Virtual for Author's lifetime
AuthorSchema.virtual("lifetime").get(function() {
  // We don't use an arrow function as we'll need the 'this' object
  const bornDay = this.date_of_birth ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED) : "Unknown";
  const deadDay = this.date_of_death ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED) : "";
  return deadDay ? `${bornDay} - ${deadDay}` : `${bornDay}`;
});

// Virtual property for date of birth formatted in YYYY-MM-DD
AuthorSchema.virtual("date_of_birth_yyyy_mm_dd").get(function() {
  return DateTime.fromJSDate(this.date_of_birth).toISODate(); // Format
});

// Virtual property for date of death formatted in YYYY-MM-DD
AuthorSchema.virtual("date_of_death_yyyy_mm_dd").get(function() {
  return DateTime.fromJSDate(this.date_of_death).toISODate(); // Format
});

// Export Model
module.exports = mongoose.model("Author", AuthorSchema);

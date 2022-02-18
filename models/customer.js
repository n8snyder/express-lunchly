"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** filters customers by search term */

  static async filterByName(searchTerm) {
    const results = await db.query(
      `SELECT id, 
                first_name AS "firstName",
                last_name  AS "lastName",
                phone,
                notes
          FROM customers
          WHERE (UPPER(first_name) like UPPER($1)) OR
                (UPPER(last_name) like UPPER($1))`,
      ['%' + searchTerm + '%']
    );

    return results.rows.map(c => new Customer(c));
  }


  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }


  /** Get top customer's by reservation count, default top ten*/

  static async filterTopCustomers(limit = 10) {
    const results = await db.query(
      `SELECT c.id AS id, first_name AS "firstName", last_name AS "lastName", phone, c.notes
            FROM reservations
            JOIN customers AS c ON customer_id = c.id
            GROUP BY c.id, first_name, last_name, phone, c.notes
            ORDER BY COUNT(*) DESC
            LIMIT $1`,
      [limit]
    );
    console.log(results.rows[0]);
    return results.rows.map(c => new Customer(c));
  }


  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }

  /** returns customer full name */

  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}

module.exports = Customer;

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
    this._notes = notes;
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

    const newCustomer = new Customer(customer);

    return newCustomer;
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
          WHERE CONCAT(first_name, ' ', last_name) ILIKE $1
          ORDER BY last_name ASC, first_name ASC`,
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
      `SELECT 
          c.id AS id, 
          first_name AS "firstName", 
          last_name AS "lastName", 
          phone, 
          c.notes
        FROM reservations
        JOIN customers AS c ON customer_id = c.id
        GROUP BY c.id
        ORDER BY COUNT(*) DESC
        LIMIT $1`,
      [limit]
    );
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

  /** Function to retrieve notes value */

  get notes() {
    return this._notes;
  }

  /** function to set ensure notes value is not falsy */

  set notes(val) {
    if (!val) {
      this._notes = "";
    } else {
      this._notes = val;
    }
  }

}



module.exports = Customer;

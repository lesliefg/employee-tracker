INSERT INTO department (name)
VALUES ('Accounting'),
       ('Inventory Control'),
       ('Engineering & Facilities'),
       ('IT'),
       ('Receiving'),
       ('Merchandising'),
       ('Sales');

INSERT INTO roles (title, salary, department_id)
VALUES ('Finance Manager', 100000, 1),
       ('ICQA', 70440, 2),
       ('Maintenance Tech 1', 85800, 3),
       ('Software Developer', 110140, 4),
       ('Dock Manager', 95300, 5),
       ('Support TM', 40500, 6),
       ('Cashier', 31200, 7);

INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ('Leslie', 'Nope', 1, null),
       ('Lance', 'McClain', 2, null),
       ('Meredith', 'Grey', 3, null),
       ('Mariana', 'Adams Foster', 4, null),
       ('Georgia', 'Miller', 5, null),
       ('April', 'Ludgate', 6, 5),
       ('Haley', 'Dunphy', 7, null);
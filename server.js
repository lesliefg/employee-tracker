//Require dependencies 
const mysql = require('mysql');
const inquirer = require('inquirer');
const consoleTable = require('console.table');
const { default: ListPrompt } = require('inquirer/lib/prompts/list');
require('dotenv').config();

const db = mysql.createConnection(
    {
        host: 'localhost',
        user: 'root',
        password: process.env.SET_DBPW,
        database: 'employee_db'
    },
);

db.connect(function(err) {
    if (err) throw err;
    console.log('Connected to the employee_db database.')
    startServer();
});

function startServer() {
    inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
                  'View all departments',
                  'View all roles',
                  'View all employees',
                  'Add a department',
                  'Add a role',
                  'Add an employee',
                  'Update an employee role',
                  'View Data',
                  'Exit'
                ]
        }]).then(function(userInput) {
        switch(userInput.action){
            case 'View all departments':
                viewAllDepartments();
                break;
            case 'View all roles':
                viewAllRoles();
                break;
            case 'View all employees':
                viewAllEmployees();
                break;
            case 'Add a department':
                addDepartment();
                break;
            case 'Add a role':
                addRole();
                break;
            case 'Add an employee':
                addEmployee();
                break;
            case 'Update an employee role':
                updateEmployeeRole();
                break;
            case 'View Data':
                viewData();
                break;
            default:
                exitServer();
        }
    })
}

// Functions
function viewAllDepartments() {
    const query = 'SELECT * FROM department';
    db.query(query, function(err, results) {
        if (err) throw err;
        console.log('Viewing all departments');
        console.table('All departments', results);
        startServer();
    })
};

function viewAllRoles() {
    const query = 'SELECT * FROM roles';
    db.query(query, function(err, results) {
        if (err) throw err;
        console.log('Viewing all Roles');
        console.table('All roles:', results);
        startServer();
    })
};

function viewAllEmployees() {
    const query = 'SELECT * FROM employee';
    db.query(query, function(err, results) {
        if (err) throw err;
        console.log('Viewing all Employees');
        console.table('All employees:', results);
        startServer();
    })
};

function addDepartment() {
    console.log('Adding new department');
    inquirer.prompt([{
        type: 'input',
        name: 'depName',
        message: 'What department would you like to add?'
    }]).then(function(answer) {
        db.query('INSERT INTO department SET ?',
        {
            name: answer.depName
        });
        const query = 'SELECT * FROM department';
        db.query(query, function(err, results) {
            if (err) throw err;
            console.log('New department added successfully!');
            console.table('All Departments', results);
            startServer();
        })
    })
};

function addRole() {
    console.log('Adding new role');
    inquirer.prompt([
        {
        type: 'input',
        name: 'role',
        message: 'What role would you like to add?'
        },
        {
        type: 'input',
        name: 'salary',
        message: 'How much does this role pay yearly? (Numbers only)'
        }
    ]).then(function(answer) {
        const params = [answer.role, answer.salary];
        const query = 'SELECT name, id FROM department';

        db.query(query, function(err, results) {
            if (err) throw err;
            const departments = results.map(({name, id}) => ({ name: name, value: id}));
            inquirer.prompt([{
                type: 'list',
                name: 'department',
                message: 'What department is the role in?',
                choices: departments
            }]).then(function(answers) {
                const department = answers.department;
                params.push(department);

                const newRole = `INSERT INTO roles (title, salary, department_id)
                                 VALUES (?, ?, ?)`;

                db.query(newRole, params,function(err, results) {
                    if (err) throw err;
                    viewAllRoles();
                })
            })
        })
    })
};


function addEmployee() {
    console.log('Adding new employee');
    inquirer.prompt([
        {
        type: 'input',
        name: 'firstName',
        message: 'What is the employees first name?'
        },
        {
        type: 'input',
        name: 'lastName',
        message: 'What is the employees last name?'
        },
    ]).then(function(answer) {
        const params = [answer.firstName, answer.lastName];
        const query = 'SELECT roles.id, roles.title FROM roles';

        db.query(query, function(err, results) {
            if (err) throw err;
            const roles = results.map(({id, title}) => ({ name: title, value: id}));
            inquirer.prompt([{
                type: 'list',
                name: 'role',
                message: 'What is the employee\'s role?',
                choices: roles
            }]).then(function(roleAnswer) {
                const role = roleAnswer.role;
                params.push(role);

                const managerArray = 'SELECT * FROM employee';

                db.query(managerArray, function(err, results) {
                    if (err) throw err;
                    const managers = results.map(({id, first_name, last_name}) => ({name: first_name + " " + last_name, value: id}));

                    inquirer.prompt([
                        {
                            type: 'confirm',
                            name: 'confirmManager',
                            message: 'Does the employee have a manager?',
                            default: false,
                        },
                        {
                        type: 'list',
                        name: 'manager', 
                        message: 'Who is the employee\'s manager?',
                        choices: managers,
                        when: ({confirmManager}) => {
                            if(confirmManager) {
                                return true;
                            } else {
                                return false;
                            }
                        }
                    }]).then(function(managerAnswer) {
                        const manager = managerAnswer.manager;
                        params.push(manager);
                        const newEmployee = `INSERT INTO employee (first_name, last_name, role_id, manager_id)
                                                        VALUES (?, ?, ?, ?)`;
                        db.query(newEmployee, params,function(err, results) {
                            if (err) throw err;
                            viewAllEmployees();
                        })
                    })
                })
            })
        })
    })
};

function updateEmployeeRole() {
    const employeeArray = `SELECT * FROM employee`;
    db.query(employeeArray, function(err, results) {
        if (err) throw err;
        const employees = results.map(({id, first_name, last_name}) => ({name: first_name + " " + last_name, value: id}));
        inquirer.prompt([
            {
            type: 'list',
            name: 'employee',
            message: 'Which employee do you want to update?',
            choices: employees
            }
        ]).then(function(employeeAnswer) {
            const employee = employeeAnswer.employee;
            const params = [];
            params.push(employee);

            const roleArray = `SELECT * FROM roles`;
            db.query(roleArray, function(err, results) {
                if (err) throw err;
                const roles = results.map(({id, title}) => ({name: title, value: id}));
                inquirer.prompt([
                    {
                    type: 'list',
                    name: 'role',
                    message: 'What is the employees new role?',
                    choices: roles
                    }
                ]).then(function(roleChoice) {
                    const role = roleChoice.role;
                    params.push(role);
                    let employee = params[0]
                    params[0] = role
                    params[1] = employee

                    const query = `UPDATE employee 
                                   SET role_id = ? 
                                   WHERE id = ?`;
                    db.query(query, params, function(err, results) {
                        if (err) throw err;
                        viewAllEmployees();
                    })
                })
            })
        })
    })
};

function viewData() {
    db.query('SELECT * FROM department', function(err, results) {
        if (err) throw err;
        console.log('Viewing all departments');
        console.table('All departments', results);
    })
    db.query('SELECT * FROM roles', function(err, results) {
        if (err) throw err;
        console.log('Viewing all roles');
        console.table('All roles', results);
    })
    db.query('SELECT * FROM employee', function(err, results) {
        if (err) throw err;
        console.log('Viewing all employee');
        console.table('All employee', results);
    })
};

// exit the app
function exitServer() {
    db.end();
};
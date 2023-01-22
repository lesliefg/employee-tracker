//Require dependencies 
const mysql = require('mysql');
const inquirer = require('inquirer');
//This will render our tables to the console
const consoleTable = require('console.table');
//This will pull our mysql passwords so that it's not hard encoded to our server file
require('dotenv').config();
//Here we create the connection 
const db = mysql.createConnection(
    {
        host: 'localhost',
        user: 'root',
        //This is where our password would normally be hard encoded
        password: process.env.SET_DBPW,
        database: 'employee_db'
    },
);
//Here we alert if there's an error or if we successfully connect and then begin the prompt function
db.connect(function(err) {
    if (err) throw err;
    console.log('Connected to the employee_db database.')
    startServer();
});
//This is our first prompt to select what action we'd like to take
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
        //Here we use a switch to alternate between the different actions and the functions they complete
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
                startServer();
                break;
            default:
                exitServer();
        }
    })
}

//All functions listed below

//First function will pull and render the departments table then bring up the actions menu again
function viewAllDepartments() {
    const query = 'SELECT * FROM department';
    db.query(query, function(err, results) {
        if (err) throw err;
        console.log('Viewing all departments');
        console.table('All departments', results);
        startServer();
    })
};
//Next we pull the roles table and then the actions menu
function viewAllRoles() {
    const query = 'SELECT * FROM roles';
    db.query(query, function(err, results) {
        if (err) throw err;
        console.log('Viewing all Roles');
        console.table('All roles:', results);
        startServer();
    })
};
//Here we pull and render the employees table then the actions menu
function viewAllEmployees() {
    const query = 'SELECT * FROM employee';
    db.query(query, function(err, results) {
        if (err) throw err;
        console.log('Viewing all Employees');
        console.table('All employees:', results);
        startServer();
    })
};
//This function allows us to add a new department to the department table then renders it with the new addition
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
//Here we add a role then render the table with the new addition
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
     //Inorder to render a list of departments, we need to pull them from our departments table then map them as an array to render for the department question
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
                //Once it is selected, we push all answers into our next query request
            }]).then(function(answers) {
                const department = answers.department;
                params.push(department);
                //Here we use '?' to show where our values will be inserted
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

//Here we are adding a new employee
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
        //Here we again request the needed information from our roles table to create a query and then map the results
        const query = 'SELECT roles.id, roles.title FROM roles';

        db.query(query, function(err, results) {
            if (err) throw err;
            const roles = results.map(({id, title}) => ({ name: title, value: id}));
            inquirer.prompt([{
                type: 'list',
                name: 'role',
                message: 'What is the employee\'s role?',
                choices: roles
            //Once answered we then push all answers and create a new query to select a manager
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
                        //If there is no manager, no is selected and null is returned as the value
                        when: ({confirmManager}) => {
                            if(confirmManager) {
                                return true;
                            } else {
                                return false;
                            }
                        }
                    //Then we push all values and create our query to add new employee
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
//Here we are updating an existing employee
function updateEmployeeRole() {
    //We create an array of all existing employees using a query then mapping
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
            //Once an employee is selected we then map our roles to update what their current role is
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
                    //Here we are updating the employee using our values pushed above
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
//This function will render all tables then bring up the action menu
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

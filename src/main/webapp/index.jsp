<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>学生管理系统</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            background-color: #f5f7fa;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
        }
        .toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.3s;
        }
        .btn-primary {
            background-color: #409eff;
            color: white;
        }
        .btn-primary:hover {
            background-color: #67b0ff;
        }
        .btn-edit {
            background-color: #67c23a;
            color: white;
            margin-right: 5px;
        }
        .btn-edit:hover {
            background-color: #85ce61;
        }
        .btn-delete {
            background-color: #f56c6c;
            color: white;
        }
        .btn-delete:hover {
            background-color: #f89898;
        }
        .btn-save {
            background-color: #409eff;
            color: white;
        }
        .btn-cancel {
            background-color: #909399;
            color: white;
            margin-left: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
        }
        th, td {
            padding: 12px;
            text-align: center;
            border-bottom: 1px solid #ebeef5;
        }
        th {
            background-color: #f5f7fa;
            font-weight: 600;
            color: #606266;
        }
        tr:hover {
            background-color: #f5f7fa;
        }
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .modal-content {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            width: 400px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .modal-content h2 {
            margin-bottom: 20px;
            color: #333;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #606266;
        }
        .form-group input, .form-group select {
            width: 100%;
            padding: 10px;
            border: 1px solid #dcdfe6;
            border-radius: 4px;
            font-size: 14px;
        }
        .form-group input:focus, .form-group select:focus {
            outline: none;
            border-color: #409eff;
        }
        .modal-footer {
            text-align: right;
            margin-top: 20px;
        }
        .message {
            padding: 10px;
            margin-bottom: 20px;
            border-radius: 4px;
            text-align: center;
            display: none;
        }
        .message.success {
            background-color: #e8f5e9;
            color: #2e7d32;
        }
        .message.error {
            background-color: #ffebee;
            color: #c62828;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>学生管理系统</h1>
        
        <div class="message" id="message"></div>
        
        <div class="toolbar">
            <button class="btn btn-primary" onclick="openAddModal()">添加学生</button>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>姓名</th>
                    <th>年龄</th>
                    <th>性别</th>
                    <th>专业</th>
                    <th>电话</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody id="studentTable">
            </tbody>
        </table>
    </div>

    <!-- 添加/编辑弹窗 -->
    <div class="modal" id="modal">
        <div class="modal-content">
            <h2 id="modalTitle">添加学生</h2>
            <form id="studentForm">
                <input type="hidden" id="studentId">
                <div class="form-group">
                    <label>姓名</label>
                    <input type="text" id="name" required>
                </div>
                <div class="form-group">
                    <label>年龄</label>
                    <input type="number" id="age" required min="1" max="100">
                </div>
                <div class="form-group">
                    <label>性别</label>
                    <select id="gender" required>
                        <option value="">请选择</option>
                        <option value="男">男</option>
                        <option value="女">女</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>专业</label>
                    <input type="text" id="major" required>
                </div>
                <div class="form-group">
                    <label>电话</label>
                    <input type="tel" id="phone" required>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-cancel" onclick="closeModal()">取消</button>
                    <button type="submit" class="btn btn-save">保存</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            loadStudents();
        });

        function loadStudents() {
            fetch('/student-management/api/students')
                .then(response => response.json())
                .then(data => {
                    const table = document.getElementById('studentTable');
                    table.innerHTML = '';
                    data.forEach(student => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${student.id}</td>
                            <td>${student.name}</td>
                            <td>${student.age}</td>
                            <td>${student.gender}</td>
                            <td>${student.major}</td>
                            <td>${student.phone}</td>
                            <td>
                                <button class="btn btn-edit" onclick="openEditModal(${student.id})">编辑</button>
                                <button class="btn btn-delete" onclick="deleteStudent(${student.id})">删除</button>
                            </td>
                        `;
                        table.appendChild(row);
                    });
                })
                .catch(error => {
                    showMessage('加载失败: ' + error.message, 'error');
                });
        }

        function openAddModal() {
            document.getElementById('modalTitle').textContent = '添加学生';
            document.getElementById('studentId').value = '';
            document.getElementById('name').value = '';
            document.getElementById('age').value = '';
            document.getElementById('gender').value = '';
            document.getElementById('major').value = '';
            document.getElementById('phone').value = '';
            document.getElementById('modal').style.display = 'flex';
        }

        function openEditModal(id) {
            fetch(`/student-management/api/students/${id}`)
                .then(response => response.json())
                .then(student => {
                    document.getElementById('modalTitle').textContent = '编辑学生';
                    document.getElementById('studentId').value = student.id;
                    document.getElementById('name').value = student.name;
                    document.getElementById('age').value = student.age;
                    document.getElementById('gender').value = student.gender;
                    document.getElementById('major').value = student.major;
                    document.getElementById('phone').value = student.phone;
                    document.getElementById('modal').style.display = 'flex';
                })
                .catch(error => {
                    showMessage('加载学生信息失败: ' + error.message, 'error');
                });
        }

        function closeModal() {
            document.getElementById('modal').style.display = 'none';
        }

        document.getElementById('studentForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const id = document.getElementById('studentId').value;
            const student = {
                name: document.getElementById('name').value,
                age: parseInt(document.getElementById('age').value),
                gender: document.getElementById('gender').value,
                major: document.getElementById('major').value,
                phone: document.getElementById('phone').value
            };

            let url = '/student-management/api/students';
            let method = 'POST';

            if (id) {
                url += '/' + id;
                method = 'PUT';
            }

            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(student)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage(data.message, 'success');
                    closeModal();
                    loadStudents();
                } else {
                    showMessage(data.message, 'error');
                }
            })
            .catch(error => {
                showMessage('操作失败: ' + error.message, 'error');
            });
        });

        function deleteStudent(id) {
            if (!confirm('确定要删除这个学生吗？')) {
                return;
            }

            fetch(`/student-management/api/students/${id}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage(data.message, 'success');
                    loadStudents();
                } else {
                    showMessage(data.message, 'error');
                }
            })
            .catch(error => {
                showMessage('删除失败: ' + error.message, 'error');
            });
        }

        function showMessage(msg, type) {
            const message = document.getElementById('message');
            message.textContent = msg;
            message.className = 'message ' + type;
            message.style.display = 'block';
            setTimeout(() => {
                message.style.display = 'none';
            }, 3000);
        }
    </script>
</body>
</html>
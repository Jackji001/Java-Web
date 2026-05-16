#include <stdio.h>
#include <stdlib.h>
#include <sqlite3.h> // 引入 SQLite 头文件

int main() {
    sqlite3 *db;
    char *err_msg = 0;
    int rc;

    // 1. 打开数据库连接
    rc = sqlite3_open("test.db", &db);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "无法打开数据库: %s\n", sqlite3_errmsg(db));
        return 1;
    }
    printf("数据库连接成功！\n");

    // 2. 执行SQL：创建表
    const char *sql_create_table = "CREATE TABLE IF NOT EXISTS Users(Id INTEGER PRIMARY KEY, Name TEXT);";
    rc = sqlite3_exec(db, sql_create_table, 0, 0, &err_msg);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "SQL错误 (创建表): %s\n", err_msg);
        sqlite3_free(err_msg);
        sqlite3_close(db);
        return 1;
    }
    printf("表创建成功！\n");

    // 3. 执行SQL：插入数据
    const char *sql_insert_data = "INSERT INTO Users(Name) VALUES('Alice'), ('Bob');";
    rc = sqlite3_exec(db, sql_insert_data, 0, 0, &err_msg);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "SQL错误 (插入数据): %s\n", err_msg);
        sqlite3_free(err_msg);
        sqlite3_close(db);
        return 1;
    }
    printf("数据插入成功！\n");

    // 4. 执行SQL：查询数据
    const char *sql_select_data = "SELECT * FROM Users;";
    printf("查询结果:\n");
    // 使用回调函数来处理查询结果
    rc = sqlite3_exec(db, sql_select_data, 
                      [](void *data, int argc, char **argv, char **azColName) {
                          for(int i=0; i<argc; i++){
                              printf("%s = %s\n", azColName[i], argv[i] ? argv[i] : "NULL");
                          }
                          printf("\n");
                          return 0;
                      }, 
                      0, &err_msg);

    if (rc != SQLITE_OK) {
        fprintf(stderr, "SQL错误 (查询数据): %s\n", err_msg);
        sqlite3_free(err_msg);
    }

    // 5. 关闭数据库连接
    sqlite3_close(db);
    printf("数据库连接已关闭。\n");
    return 0;
}
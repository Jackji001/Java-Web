#include <stdio.h>
#include <sqlite3.h>

int main() {
    sqlite3 *db;
    int rc;

    printf("正在尝试打开数据库...\n");

    // 打开名为 test.db 的数据库（如果不存在会自动创建）
    rc = sqlite3_open("test.db", &db);

    if (rc) {
        fprintf(stderr, "无法打开数据库: %s\n", sqlite3_errmsg(db));
        return(0);
    } else {
        fprintf(stdout, "数据库打开成功!\n");
    }

    // 关闭连接
    sqlite3_close(db);
    
    return 0;
}
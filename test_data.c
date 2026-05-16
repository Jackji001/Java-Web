#include <stdio.h>

int test(int & x){
    x=1024;
    printf("text函数内部 x=%d\n",x);
}
int main(){
    int x=1;
    printf("调用 x前=%d\n",x);
    test(x);
    printf("调用 x后=%d\n",x);    
    return 0;
}
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int input()
{
    int a;
    scanf("%d",&a);
    return a;
}

int random_output()
{
    int a;
    a=rand()%100+1;
    return a;
}

int compare(int a,int b)
{
    if(a==b)
    {
        printf("a == b\n");
    }
    else if(a>b)
    {
        printf("a > b\n");
    }
    else
    {
        printf("a < b\n");
    }
}

int main()
{
    srand(time(NULL));
    int a,b;
    a=input();
    b=random_output();
    compare(a,b);
    return 0;
}
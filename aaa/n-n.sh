#!/bin/sh

echo "九九乘法表"
echo "=================="
#添加注释

i=1
while [ $i -le 9 ]; do
  j=1
  while [ $j -le $i ]; do
    result=$((i * j))
    printf "%d*%d=%-2d " $j $i $result
    j=$((j + 1))
  done
  echo ""
  i=$((i + 1))
done

echo "=================="
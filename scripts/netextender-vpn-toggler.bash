#!/bin/bash
#
# Copyright (c) 2021 Xavier Berger
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
# 
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

#
# Support script for NetExtender from SonicWall
#
# Requirements:
# * NetExtender
# * iproute2

if [ -z $1 ]
then
	exit 1
fi

if [ $1 == "start" ]
then
	password=$(zenity --password)
	if [ ! -z ${password} ] 
	then
		kill -9 $(pidof netExtender)
		echo "Y" | netExtender --auto-reconnect -u username -p ${password} -d domain.example.com 999.999.999.999 
	fi
fi

if [ $1 == "stop" ]
then
	kill -9 $(pidof netExtender)
fi

if [ $1 == "ip" ]
then
	ip addr show ppp0 | perl -ne '/(172.\d+.\d+.\d+)/ and print $1'
fi

#!/usr/bin/env /bin/sh
#
# Copyright (c) 2021 Guilhem Bonnefille
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
# Support script for GlobalProtect from Palo Alto Networks
#
# Requirements:
# * GlobalProtect
# * ip command
# * jq command

if [ -z $1 ]
then
	exit 1
fi

# Global Protect uses proxy settings
unset "http_proxy"
unset "https_proxy"
unset "all_proxy"
unset "socks_proxy"
unset "ftp_proxy"
unset "HTTP_PROXY"
unset "HTTPS_PROXY"
unset "ALL_PROXY"

case $1 in

"start")
	globalprotect connect
;;
"stop")
	globalprotect disconnect
;;
"ip")
    # Do not use globalprotect command as it takes long time to return
    # and in a polling strategy it will block start/stop commands every time
    # (a single globalprotect command is accepted at a time)
	ip -j addr show gpd0 | jq -r '.[] | select(any(.flags[]; . == "UP")) |.addr_info|.[]|.local'
;;
esac

/*
 * Copyright (c) 2021 Xavier Berger
 *
 * This code has been inspired from wireguard-indicator@atareao.es from 
 *   Lorenzo Carbonell Cerezo <a.k.a. atareao>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

const { Gtk, Gdk, Gio, Clutter, St, GObject, GLib } = imports.gi;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;

const ByteArray = imports.byteArray;

const STATUS = { error: -1, unknown: 0, connected: 1, disconnected: 2 };

var button;

var CustomVpnToggler = GObject.registerClass(
    class CustomVpnToggler extends PanelMenu.Button {

        _init() {
            super._init(St.Align.START);
            this._settings = Convenience.getSettings();

            /* Icon indicator */
            this.vpnErrorIcon = Gio.icon_new_for_string(Extension.path + '/images/security-low-symbolic.svg');  // error
            this.vpnOffIcon = Gio.icon_new_for_string(Extension.path + '/images/security-medium-symbolic.svg'); // disconnected
            this.vpnOnIcon = Gio.icon_new_for_string(Extension.path + '/images/security-high-symbolic.svg');    // connected

            let box = new St.BoxLayout();
            this.label = new St.Label({
                text: '',
                y_expand: true,
                y_align: Clutter.ActorAlign.CENTER
            });

            this.icon = new St.Icon({ style_class: 'system-status-icon' });
            this.icon.set_gicon(this.vpnErrorIcon);
            box.add(this.icon);
            box.add(this.label);
            this.add_child(box);

            /* Start Menu */
            this.vpnSwitch = new PopupMenu.PopupSwitchMenuItem('...', { active: true });
            this.vpnSwitch.setToggleState(false);
            this.vpnSwitch.connect('toggled', this._toggleSwitch.bind(this));
            this.vpnIp = new PopupMenu.PopupMenuItem('Initialisation...');
            this.menu.addMenuItem(this.vpnSwitch);
            this.menu.addMenuItem(this.vpnIp);
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            this.settingsMenuItem = new PopupMenu.PopupMenuItem("Settings");
            this.settingsMenuItem.connect('activate', () => {
                ExtensionUtils.openPrefs();
                this._prevStatus = STATUS.unknown;
                this._update();
            });
            this.menu.addMenuItem(this.settingsMenuItem);
            let menu_item = new PopupMenu.PopupImageMenuItem('Project Page',
                Gio.icon_new_for_string(Extension.path + '/images/icon.png'));
            menu_item.connect('activate', () => {
                Gio.app_info_launch_default_for_uri("https://gitlab.com/XavierBerger/custom-vpn-toggler", null);
            });
            let menu_help = new PopupMenu.PopupSubMenuMenuItem('Help');
            menu_help.menu.addMenuItem(menu_item);
            this.menu.addMenuItem(menu_help);

            /* Initialization */
            this._status = this._prevStatus = STATUS.unknown;
            this._sourceId = 0;
            this._settings.connect('changed', this._settingsChanged.bind(this));
            this._settingsChanged();
            this._update();
        }

        _getValue(keyName) {
            return this._settings.get_value(keyName).deep_unpack();
        }

        _toggleSwitch(widget, value) {
            let command = [this._getValue('vpn'), ((value) ? 'start' : 'stop')];
            try {
                let proc = Gio.Subprocess.new(
                    command,
                    Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
                );
                proc.communicate_utf8_async(null, null, (proc, res) => {
                    try {
                        let [, stdout, stderr] = proc.communicate_utf8_finish(res);
                        return true, stdout, stderr;
                    } catch (e) {
                        logError(e);
                    }
                });
            } catch (e) {
                logError(e);
            }
            this._update();
        }

        _update() {
            if (this._getValue('vpn') === "") {
                this._status = STATUS.error;
            }
            else {
                var [ok, stdout, err, ext] = GLib.spawn_command_line_sync('/bin/bash -c "ls ' + this._getValue('vpn') + '"');
                if (stdout === "") {
                    this._status = STATUS.error;
                }
                else {
                    var [ok, out, err, exit] = GLib.spawn_command_line_sync(
                        '/bin/bash -c "' + this._getValue('vpn') + ' ip"');
                    if (out.length > 0) {
                        this._status = STATUS.connected;
                    }
                    else {
                        this._status = STATUS.disconnected;
                    }
                }
            }
            if (this._status != this._prevStatus) {
                log("vpn status changed");
                switch (this._status) {
                    case STATUS.connected:
                        this.icon.set_gicon(this.vpnOnIcon);
                        if (this.vpnSwitch) {
                            this.vpnSwitch.setSensitive(true);
                            this.vpnSwitch.label.set_text('Disable VPN');
                            this.vpnSwitch.setToggleState(true);
                        }
                        if (this.vpnIp) {
                            this.vpnIp.setSensitive(true);
                            this.vpnIp.label.set_text("IP address: " + ByteArray.toString(out));
                        }
                        this._prevStatus = STATUS.connected;
                        break;

                    case STATUS.disconnected:
                        this.icon.set_gicon(this.vpnOffIcon);
                        if (this.vpnSwitch) {
                            this.vpnSwitch.label.set_text('Enable VPN');
                            this.vpnSwitch.setToggleState(false);
                        }
                        if (this.vpnIp) {
                            this.vpnIp.label.set_text("VPN disconnected");
                        }
                        this._prevStatus = STATUS.disconnected;
                        break;

                    case STATUS.error:
                        this.icon.set_gicon(this.vpnErrorIcon)
                        if (this.vpnSwitch) {
                            this.vpnSwitch.label.set_text('Script error detected');
                            this.vpnSwitch.setSensitive(false);
                        }
                        if (this.vpnIp) {
                            this.vpnIp.label.set_text("Please update your setting\nand see help if needed.");
                            this.vpnIp.setSensitive(false);
                        }
                        this._prevStatus = STATUS.error;
                        break;
                }
            }
            return true;
        }

        _settingsChanged() {
            // this.counter = 0;
            if (this._sourceId > 0) {
                GLib.source_remove(this._sourceId);
            }
            this._sourceId = GLib.timeout_add_seconds(
                GLib.PRIORITY_DEFAULT, this._getValue('checktime'),
                this._update.bind(this));
            log(this._sourceId);
            this._update();
        }

        disableUpdate() {
            if (this._sourceId > 0) {
                GLib.source_remove(this._sourceId);
            }
        }
    }
);

let customeVpnToggler;

function init() {
}

function enable() {
    customeVpnToggler = new CustomVpnToggler();
    Main.panel.addToStatusArea('customeVpnToggler', customeVpnToggler, 0, 'right');
}

function disable() {
    customeVpnToggler.disableUpdate();
    customeVpnToggler.destroy();
}

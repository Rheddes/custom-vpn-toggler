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

imports.gi.versions.GLib = "2.0";
imports.gi.versions.GObject = "2.0";
imports.gi.versions.Gio = "2.0";
imports.gi.versions.Gtk = "3.0";

const { GLib, GObject, Gio, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;
const PreferencesWidget = Extension.imports.preferenceswidget;

function init() {
    Convenience.initTranslations();
}

var CustomVpnTogglerPreferencesWidget = GObject.registerClass(
    class CustomVpnTogglerPreferencesWidget extends PreferencesWidget.Page {
        _init() {
            super._init();

            var settings = Convenience.getSettings();

            let indicatorSection = this.addSection("", null, {});
            indicatorSection.addGSetting(settings, "vpn");
            let help = new Gtk.Label({
                label: "<small>" +
                    "<b>VPN command have to implement the following parameters</b>:\n" +
                    " - <b>start</b>: to start VPN - If required, this command could display GUI.\n" +
                    " - <b>stop</b>: to stop VPN.\n" +
                    " - <b>ip</b>: to get IP address - If not IP is available, this function should return nothing." +
                    "\n" +
                    "<i>Note: parameter <b>ip</b> is used to determine if VPN is started or not.</i>" +
                    "</small>",
                use_markup: true
            });
            indicatorSection.addRow(help);

            let checktimeSection = this.addSection("", null, {});
            checktimeSection.addGSetting(settings, "checktime");
        }
    }
);

function buildPrefsWidget() {
    let preferencesWidget = new CustomVpnTogglerPreferencesWidget();
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, () => {
        let prefsWindow = preferencesWidget.get_toplevel()
        prefsWindow.set_position(Gtk.WindowPosition.CENTER_ALWAYS);
        return false;
    });

    preferencesWidget.show_all();
    return preferencesWidget;
}

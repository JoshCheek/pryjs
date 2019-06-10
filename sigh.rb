stdino  = $stdin.dup
stdouto = $stdout.dup
stderro = $stderr.dup

stdinr,  stdinw  = IO.pipe
stdoutr, stdoutw = IO.pipe
stderrr, stderrw = IO.pipe

$stdin.reopen  stdinr
$stdout.reopen stdoutw
$stderr.reopen stderrw
stdinr.close
stdoutw.close
stderrw.close
$stdin.sync  = true
$stdout.sync = true
$stderr.sync = true

pid = spawn(
  'ruby', '-e', <<~'RUBY',
  stdin  = IO.new 3, 'w'
  stdout = IO.new 4, 'r'
  stderr = IO.new 5, 'r'
  stdin.sync  = true
  stdout.sync = true
  stderr.sync = true
  puts "Type a line"
  line = gets.chomp
  puts "PRY-IN(#{line.inspect})"
  stdin.puts line
  $stdout.puts "PRY-OUT(#{stdout.gets.chomp})"
  $stderr.puts "PRY-ERR(#{stderr.gets.chomp})"
  stdin.close
  stdout.close
  stderr.close
  exit
  RUBY
  0 => stdino, 1 => stdouto, 2 => stderro,
  3 => stdinw, 4 => stdoutr, 5 => stderrr,
)
stdinw.close
stdoutr.close
stderrr.close

line = gets.chomp
puts "PARENT-OUT(#{line.inspect})"
$stderr.puts "PARENT-ERR(#{line.inspect})"

Process.wait pid

$stdin.reopen  stdino
$stdout.reopen stdouto
$stderr.reopen stderro

puts
puts "Type a line"
line = gets.chomp
puts "PARENT-OUT(#{line.inspect})"
$stderr.puts "PARENT-ERR(#{line.inspect})"
